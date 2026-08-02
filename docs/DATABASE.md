# Database Design

MongoDB, accessed via Mongoose. Five collections back the whole app.

## ER Diagram

```mermaid
erDiagram
    USER ||--o{ TOKEN : books
    USER ||--o{ NOTIFICATION : receives
    MENUITEM ||--o{ TOKEN : "referenced by items"
    TOKEN ||--o{ NOTIFICATION : "relates to"

    USER {
        ObjectId _id
        string name
        string email UK
        string password
        string role "student|staff|admin"
        string phone
        string studentId
        number counterAssigned
        boolean isActive
        boolean darkMode
        number refreshTokenVersion
    }

    MENUITEM {
        ObjectId _id
        string name
        string category "Breakfast|Meals|Snacks|Beverages|Combos"
        number price
        number prepTimeMinutes
        number stock
        boolean isAvailable
        boolean isPopular
        number totalOrders
    }

    TOKEN {
        ObjectId _id
        string tokenCode UK
        number sequence
        ObjectId student FK
        array items "embedded TokenItem[]"
        number totalAmount
        string status "waiting|preparing|ready|completed|cancelled|skipped"
        number counter
        number estimatedWaitMinutes
        date queuedAt
        date calledAt
        date completedAt
        boolean isVip
    }

    NOTIFICATION {
        ObjectId _id
        ObjectId user FK
        string type "queue_near|queue_current|ready|system|announcement"
        string title
        string message
        boolean read
        ObjectId relatedToken FK
    }

    SETTINGS {
        ObjectId _id
        boolean queuePaused
        string pauseReason
        number totalCounters
        string announcement
        number averagePrepBufferMinutes
    }
```

`Settings` is a singleton document (`singletonKey: 'GLOBAL'`), lazily created
on first access.

## Sequence: booking and serving a token

```mermaid
sequenceDiagram
    participant S as Student (browser)
    participant API as Express API
    participant DB as MongoDB
    participant IO as Socket.IO
    participant St as Staff (browser)

    S->>API: POST /queue/tokens {items}
    API->>DB: create Token (status=waiting)
    API->>DB: decrement MenuItem stock
    API-->>S: 201 {token}
    API->>IO: emit queue:updated (queue-room, tv-room, staff-room)
    IO-->>St: queue:updated

    St->>API: POST /queue/call-next {counter}
    API->>DB: find next waiting Token, set status=preparing
    API-->>St: 200 {token}
    API->>IO: emit token:called + queue:updated
    API->>DB: create Notification (queue_current)
    IO-->>S: notification:new (chime + toast)

    St->>API: PATCH /queue/tokens/:id/complete
    API->>DB: set status=completed
    API->>IO: emit queue:updated
    IO-->>S: queue:updated (token cleared from active view)
```

## Queue flow (state machine)

```mermaid
flowchart LR
    A[waiting] -->|call-next| B[preparing]
    B -->|mark ready| C[ready]
    B -->|complete| D[completed]
    C -->|complete| D
    A -->|skip| E[skipped]
    B -->|skip| E
    E -->|recall| A
    A -->|cancel by student| F[cancelled]
```

## Indexing notes

- `Token`: compound index on `{ status: 1, sequence: 1 }` for fast live-queue queries, and `{ student: 1, createdAt: -1 }` for history lookups.
- `MenuItem`: text index on `name` for search, plus `{ category: 1 }`.
- `User`: unique index on `email`.
- `Notification`: `{ user: 1, createdAt: -1 }` for the notification feed.

## Token code generation

Codes are generated per-day (`A001`, `A002`, … `A999`, then `B001`, …) based
on how many tokens have been created since midnight — see
`generateTokenCode()` in `backend/src/services/queueService.ts`.
