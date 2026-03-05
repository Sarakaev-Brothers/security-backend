# End-to-End Group Key System --- Variant B (Always-On Group Key)

## Goal

Implement an E2EE system for location sharing where: - **A valid group
key always exists in the group.** - Any change in group membership →
**immediate key rotation**. - The server has no access to decrypted data
(**zero-knowledge**).

> Key invariant: `group has exactly 1 active groupKey at any time`.

------------------------------------------------------------------------

## Architecture

-   Client: React Native (iOS)
-   Server: NestJS
-   Storage:
    -   Redis --- real-time payload (TTL)
    -   Postgres (optional) --- history (ciphertext only)

------------------------------------------------------------------------

## Cryptography (do not change)

  Purpose                  Algorithm
  ------------------------ -------------------------------
  User keys (signatures)   Ed25519 (optional for MVP)
  Key exchange             X25519 (ECDH)
  Group key                32 bytes (AES-256)
  Payload                  AES-256-GCM
  Client storage           iOS Keychain / Secure Enclave

------------------------------------------------------------------------

## Core Invariant (important)

1.  A group **never exists in a state without a key**.
2.  When membership changes (join/leave):
    -   the current key is considered **outdated**,
    -   **the first online participant** initiates rotation.
3.  If everyone is offline:
    -   the old key temporarily remains,
    -   rotation is performed **when the first participant comes
        online**.

------------------------------------------------------------------------

## 0) User Key Registration (once per device)

### Client

-   Generates `dhKeyPair` (X25519).
-   Stores `dhPrivateKey` in Keychain.
-   Sends `dhPublicKey` to the server.

### API

`POST /user/public-keys`

``` json
{ "dhPublicKey": "base64..." }
```

The server stores only public keys.

------------------------------------------------------------------------

## 1) Group Creation (empty object)

### Client A

`POST /group`

``` json
{ "name": "Family" }
```

### Server

Creates:

    groupId = 123
    members = [A]
    currentKeyVersion = null
    membersHash = hash([A])

Returns:

``` json
{ "groupId": 123 }
```

------------------------------------------------------------------------

## 2) Inviting Members

### Client A

`POST /group/123/invite`

``` json
{ "users": ["B", "C", "G"] }
```

### Server

    members = [A, B, C, G]
    membersHash = hash([A, B, C, G])

The server pushes the event:

    GROUP_MEMBERS_CHANGED

------------------------------------------------------------------------

## 3) Key Activation (first online user initiates)

Any online user (usually A) when opening the group:

-   Sees `currentKeyVersion == null` or `membersHash` has changed.
-   Generates `groupKey`, `version = 1`.
-   Requests public keys of members:

`GET /group/123/members/public-keys`

Encrypts `groupKey` for each member and sends:

`POST /group/123/keys`

``` json
{
  "version": 1,
  "keys": {
    "A": "encForA",
    "B": "encForB",
    "C": "encForC",
    "G": "encForG"
  }
}
```

Server:

    currentKeyVersion = 1
    stores encFor*

Pushes:

    GROUP_KEY_UPDATED (version=1)

------------------------------------------------------------------------

## 4) Key Retrieval by Members

Clients:

`GET /group/123/keys` → receive their entry →

perform ECDH → AES decrypt → store `groupKey` locally.

------------------------------------------------------------------------

## 5) Sending Geolocation

### Client

``` ts
payload = AES-256-GCM(groupKey, location, aad={groupId, version})
```

`POST /geo/update`

``` json
{ "groupId": 123, "version": 1, "payload": "base64..." }
```

### Server

Stores only `payload` in Redis (TTL).

------------------------------------------------------------------------

## 6) Version Check

If the client sends `version < currentKeyVersion`:

Server returns:

``` json
{ "error": "KEY_OUTDATED", "currentKeyVersion": 2 }
```

The client must request new keys.

------------------------------------------------------------------------

## 7) Key Rotation (mandatory on join/leave)

Trigger: - `GROUP_MEMBERS_CHANGED` - or `KEY_OUTDATED`

Any online participant:

1.  Generates `newGroupKey`.
2.  `version = old + 1`.
3.  Requests public keys of current members.
4.  Encrypts for all members.
5.  Sends:

`POST /group/123/rotate-key`

``` json
{
  "version": 2,
  "keys": {
    "A": "encForA2",
    "B": "encForB2",
    "C": "encForC2",
    "G": "encForG2",
    "D": "encForD2"
  }
}
```

Server:

    currentKeyVersion = 2
    membersHash = hash(currentMembers)

Pushes:

    GROUP_KEY_UPDATED (version=2)

------------------------------------------------------------------------

## 8) New Member Joining (D)

1.  Server adds D → `membersHash` changes.
2.  Server pushes `GROUP_MEMBERS_CHANGED`.
3.  The first online member initiates rotation.
4.  D receives only the new key and **cannot see old data**.

------------------------------------------------------------------------

## Guarantees

-   The server does not know `groupKey` and cannot read data.
-   Loss of a key = loss of data for that version.
-   A removed participant cannot read future data.
-   A new participant cannot read past data.

------------------------------------------------------------------------

## Push Notifications

Used **only as a trigger**:

    { type: "GROUP_KEY_UPDATED", groupId, version }

Keys are always fetched through the API.

------------------------------------------------------------------------

## Core Principle

The server is a mailbox.\
Keys belong to people.\
Without a `groupKey`, there is no secure group.
