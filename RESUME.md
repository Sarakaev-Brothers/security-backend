# Backend Subscription & Group Architecture (iOS IAP)

## Overview

- A user **purchases a subscription**
- The subscription **creates a group**
- **Group members** receive access
- Apple **only confirms payments**
- All business logic is handled **on the backend**

---

## Core Idea

> **The subscription belongs to the group, not the user.**

A user pays → becomes the group owner → invites other members → access is validated through the group and its subscription.

---

## Entities & Responsibilities

### User

- Represents a user account
- Can be a member of **only one group**
- Does **not** store subscription data

---

### Plan

Static reference data.

- `plan_5` → 5 members
- `plan_10` → 10 members

---

### Group

- Logical collection of users
- Has an **owner (payer)**
- Uses a **plan**
- Can be disabled or deleted

---

### Subscription

- A **database record**
- Belongs to a **group**
- Serves as the **source of truth for access control**

Stores:

- `appleTransactionId`
- `expiresAt`
- `status: active | expired | refunded`

---

### GroupMember

Relationship between **User ↔ Group**

- `pending` — slot reserved, user has not joined yet
- `active` — user is part of the group

---

### InviteLink

- A **single-use invite link**
- Creates a `pending` slot
- Can be revoked by the group owner

---

## Purchase Flow

### iOS

1. Purchase via StoreKit
2. Receive `transactionId`
3. Send `transactionId` to the backend

### Backend

1. Validate the transaction via the Apple API
2. Create a `Group`
3. Create a `Subscription (active)`
4. The user becomes the **group owner**

---

## Invite Flow

1. Owner creates an invite link
2. `GroupMember (pending)` is created
3. Slot limit decreases
4. User joins via the invite link
5. `pending → active`

Owner can:

- remove pending members
- remove active members
- delete the group

Members can:

- leave the group at any time

---

## Access Validation (Runtime)

**Apple is not queried during runtime.**

Algorithm:

1. Find the user's group
2. Find the group's subscription
3. Check:

   - `status === active`
   - `expiresAt > now`

If both conditions are true → access is granted.

---

## Subscription Renewal / Revocation

Handled via **App Store Server Notifications (webhooks)**:

- `DID_RENEW` → update `expiresAt`
- `EXPIRED` → `status = expired`
- `REFUND` → `status = refunded`

The client is **not involved** in this process.

---

## Why This Architecture

- One payment = one group
- Simple access validation
- Clear separation of responsibilities
- Scales well
- Apple is isolated from business logic

---

## Technologies

- **NestJS**
- **PostgreSQL**
- **Prisma**
- Apple **App Store Server API**

---

## Key Idea

> **A subscription is a database record, not a state inside Apple.**  
> Apple confirms events, while the backend controls access.
