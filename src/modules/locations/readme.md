# End-to-End Group Key System — Variant B (Always-On Group Key)

## Цель
Реализовать систему E2EE для геолокации, где:
- **В группе всегда существует валидный групповой ключ.**
- Любое изменение состава группы → **немедленная ротация ключа**.
- Сервер не имеет доступа к расшифрованным данным (zero-knowledge).

> Ключевой инвариант: `group has exactly 1 active groupKey at any time`.

---

## Архитектура
- Клиент: React Native (iOS)
- Сервер: NestJS
- Хранилища:
  - Redis — real-time payload (TTL)
  - Postgres (опционально) — история (только шифротекст)

---

## Криптография (не менять)
| Задача | Алгоритм |
|---|---|
| User keys (подписи) | Ed25519 (опционально для MVP) |
| Key exchange | X25519 (ECDH) |
| Group key | 32 bytes (AES-256) |
| Payload | AES-256-GCM |
| Хранение на клиенте | iOS Keychain / Secure Enclave |

---

## Базовый инвариант (важно)
1. В группе **никогда не бывает состояния без ключа**.
2. При изменении состава (join/leave):
   - текущий ключ считается **устаревшим**,
   - **первый онлайн-участник** инициирует ротацию.
3. Если все оффлайн:
   - старый ключ временно остаётся,
   - ротация выполняется **при первом входе любого участника**.

---

## 0) Регистрация ключей пользователя (один раз на девайс)
### Клиент
- Генерирует `dhKeyPair` (X25519).
- Сохраняет `dhPrivateKey` в Keychain.
- Отправляет `dhPublicKey` на сервер.

### API
`POST /user/public-keys`
```json
{ "dhPublicKey": "base64..." }
```

Сервер хранит только публичные ключи.

---

## 1) Создание группы (пустой объект)
### Клиент A
`POST /group`
```json
{ "name": "Family" }
```

### Сервер
Создаёт:
```
groupId = 123
members = [A]
currentKeyVersion = null
membersHash = hash([A])
```

Возвращает:
```json
{ "groupId": 123 }
```

---

## 2) Приглашение участников
### Клиент A
`POST /group/123/invite`
```json
{ "users": ["B", "C", "G"] }
```

### Сервер
```
members = [A, B, C, G]
membersHash = hash([A, B, C, G])
```

Сервер пушит событие:
```
GROUP_MEMBERS_CHANGED
```

---

## 3) Активация ключа (первый онлайн инициирует)
Любой онлайн (обычно A) при открытии группы:
- Видит `currentKeyVersion == null` или `membersHash` изменился.
- Генерирует `groupKey`, `version = 1`.
- Запрашивает публичные ключи членов:
  `GET /group/123/members/public-keys`.

Шифрует `groupKey` для каждого и отправляет:
`POST /group/123/keys`
```json
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

Сервер:
```
currentKeyVersion = 1
stores encFor*
```

Пушит:
```
GROUP_KEY_UPDATED (version=1)
```

---

## 4) Получение ключа участниками
Клиенты:
`GET /group/123/keys` → получают свою запись →
делают ECDH → AES decrypt → сохраняют локально `groupKey`.

---

## 5) Отправка геолокации
### Клиент
```ts
payload = AES-256-GCM(groupKey, location, aad={groupId, version})
```

`POST /geo/update`
```json
{ "groupId": 123, "version": 1, "payload": "base64..." }
```

### Сервер
Хранит только `payload` в Redis (TTL).

---

## 6) Проверка версии
Если клиент прислал `version < currentKeyVersion`:
Сервер возвращает:
```json
{ "error": "KEY_OUTDATED", "currentKeyVersion": 2 }
```

Клиент обязан запросить новые ключи.

---

## 7) Ротация ключа (обязательно при join/leave)
Триггер:
- `GROUP_MEMBERS_CHANGED`
- или `KEY_OUTDATED`

Любой онлайн участник:
1. Генерирует `newGroupKey`.
2. `version = old + 1`.
3. Запрашивает публичные ключи текущих членов.
4. Шифрует для всех.
5. Отправляет:

`POST /group/123/rotate-key`
```json
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

Сервер:
```
currentKeyVersion = 2
membersHash = hash(currentMembers)
```

Пушит:
```
GROUP_KEY_UPDATED (version=2)
```

---

## 8) Вход нового участника (D)
1. Сервер добавляет D → `membersHash` меняется.
2. Сервер пушит `GROUP_MEMBERS_CHANGED`.
3. Первый онлайн участник инициирует ротацию.
4. D получает только новый ключ и **не видит старые данные**.

---

## Гарантии
- Сервер не знает `groupKey` и не может читать данные.
- Потеря ключа = потеря данных этой версии.
- Ушедший участник не может читать будущие данные.
- Новый участник не может читать прошлые данные.

---

## Push-уведомления
Используются **только как триггер**:
```
{ type: "GROUP_KEY_UPDATED", groupId, version }
```
Ключи всегда загружаются через API.

---

## Главный принцип
Сервер — почтовый ящик.
Ключи принадлежат людям.
Без groupKey нет защищённой группы.
