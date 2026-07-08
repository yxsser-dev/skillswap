# SkillSwap - Peer-to-Peer Skill Exchange & Micro-Tutoring Marketplace

SkillSwap is a capstone-level web application designed to connect users who want to exchange skills on a direct, mutual-benefit model. The platform features an algorithmic matching engine, a real-time scheduler, verification checks, and administrative control panels.

---

## 🚀 Technical Stack
* **Backend**: Node.js / Express.js
* **Database**: PostgreSQL (raw SQL queries using `pg` client pool)
* **Frontend**: React (scaffolded with Vite, styled with custom Glassmorphism Vanilla CSS)
* **Validation**: Zod (type-safe request validation schemas)
* **Security**: JSON Web Tokens (Access/Refresh token rotation), bcryptjs password hashing

---

## 🛠️ Security & Architecture Policies

### 1. Token Expiration & Rotation (JWT)
* **Access Tokens**: Expire in **15 minutes**.
* **Refresh Tokens**: Expire in **7 days**.
* **Rotation**: On every token refresh request, the previous active refresh token is deleted from the `refresh_tokens` table, and a new matching pair is issued and stored to prevent replay attacks.

### 2. Swap Booking Verification Rules
* **Status Transitions**: Only the listed `teacher_id` can progress a session status from `'accepted'` to `'completed'`.
* **Reviews constraints**: A user can only submit a review for bookings matching `status = 'completed'`.
* **Double Review Prevention**: Handled via database level unique constraint `UNIQUE (booking_id, reviewer_id)`.

### 3. Extra Features (Going Beyond Class Material)
* **Heuristic Matching Algorithm**: Ranks candidates dynamically based on:
  * **Reciprocity (Mutual Swap)**: Highest weight (+100) if User A teaches what User B wants and vice-versa.
  * **On-The-Fly Ratings**: Incorporates average feedback scores (+10 points per aggregate star rating).
  * **Availability Overlaps**: Computes schedule matches (+10 points per matching day/time slot).
  * **Explainability List**: Returns an array of matching reasons.
* **API Rate Limiter**: Limits requests to a maximum of 100 per 15 minutes per IP address to safeguard server resources.
* **Audit Logger**: Outputs structured system logs capturing endpoint usage and response runtimes.

---

## 💾 Database Schema (ER Diagram)

The relational database is configured based on the following entity-relationship diagram:

```mermaid
erDiagram
    USERS ||--o{ REFRESH_TOKENS : "has"
    USERS ||--o{ LISTINGS : "creates"
    USERS ||--o{ BOOKINGS : "participates"
    USERS ||--o{ REVIEWS : "receives"
    USERS ||--o{ REPORTS : "files"
    SKILLS ||--o{ LISTINGS : "categorizes"
    LISTINGS ||--o{ BOOKINGS : "schedules"
    BOOKINGS ||--o{ REVIEWS : "generates"

    USERS {
        int id PK
        string username
        string email
        string password_hash
        string role
        boolean is_suspended
        text bio
        string profile_picture_url
        timestamp created_at
    }

    REFRESH_TOKENS {
        int id PK
        int user_id FK
        string token
        timestamp expires_at
        timestamp created_at
    }

    SKILLS {
        int id PK
        string name
        string category
    }

    LISTINGS {
        int id PK
        int user_id FK
        int skill_id FK
        string type
        text description
        string proficiency_level
        jsonb availability
        boolean is_active
        timestamp created_at
    }

    BOOKINGS {
        int id PK
        int listing_id FK
        int teacher_id FK
        int learner_id FK
        timestamp session_time
        string status
        timestamp created_at
    }

    REVIEWS {
        int id PK
        int booking_id FK
        int reviewer_id FK
        int reviewee_id FK
        int rating
        text comment
        timestamp created_at
    }

    REPORTS {
        int id PK
        int reporter_id FK
        int reported_user_id FK
        int listing_id FK
        int booking_id FK
        text reason
        string status
        text resolution_note
        timestamp created_at
    }
```

---

## ⚙️ Project Setup & Installation

### **Prerequisites**
* Node.js (version 18+ recommended)
* PostgreSQL database engine

### **1. Configure Environment Variables**
Create a `.env` file inside the root folder:
```env
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/skillswap
JWT_ACCESS_SECRET=your_custom_access_secret_123
JWT_REFRESH_SECRET=your_custom_refresh_secret_123
```

### **2. Install Dependencies**
```bash
# Install root/backend packages
npm install

# Install client packages
cd client
npm install
cd ..
```

### **3. Initialize Database Schema**
Ensure PostgreSQL is running, then execute the migration script:
```bash
npm run db:init
```

### **4. Start the Application**
```bash
npm run dev
```