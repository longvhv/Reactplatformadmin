# Authentication Flow

## Overview

VHV Platform uses a dual-table authentication system for flexibility and security:

1. **`auth_identifiers`** - Maps identifiers (email, phone, etc.) to user_id
2. **`user_identities`** - Stores actual credentials and authentication methods

## Database Schema

### auth_identifiers
```sql
- tenant_id: UUID (partition key)
- identifier_hash: BYTEA (SHA256 hash of identifier)
- user_id: UUID (references users._id)
- identity_id: UUID (references user_identities._id)
- identifier_type: VARCHAR(20) (PASSWORD, GOOGLE, etc.)
- original_value: TEXT (nullable, original identifier for debugging)
```

### user_identities
```sql
- _id: UUID (primary key)
- user_id: UUID (references users._id)
- identity_type: VARCHAR(20) (PASSWORD, GOOGLE, GITHUB, etc.)
- identity_value: TEXT (email, oauth_id, etc.)
- credential_secret: TEXT (password hash, oauth tokens, etc.)
- metadata: JSONB (additional data)
- is_verified: BOOLEAN
- verified_at: TIMESTAMP
- last_login_at: TIMESTAMP
```

## Login Flow

### Step 1: Find User ID
```go
// Query auth_identifiers with email
authIdentifier, err := authIdentifierRepo.GetByIdentifier(ctx, email, "PASSWORD")
// Returns: user_id, identity_id
```

### Step 2: Get User Identity
```go
// Query user_identities with user_id and type
userIdentity, err := userIdentityRepo.GetByUserIDAndType(ctx, userID, "PASSWORD")
// Returns: credential_secret (password hash)
```

### Step 3: Verify Password
```go
// Verify password against credential_secret
if !auth.VerifyPassword(password, userIdentity.CredentialSecret) {
    return error
}
```

### Step 4: Get User Details
```go
// Get full user details
user, err := userRepo.GetByID(ctx, userID)
```

### Step 5: Update Login Times
```go
// Update last_login_at in user_identities
userIdentity.LastLoginAt = time.Now()
userIdentityRepo.Update(ctx, userIdentity)

// Update user table
user.LastLoginAt = time.Now()
userRepo.Update(ctx, user)
```

### Step 6: Generate Tokens
```go
accessToken := jwtManager.GenerateAccessToken(user.ID, user.Email, ...)
refreshToken := jwtManager.GenerateRefreshToken(user.ID)
```

## Registration Flow

### Step 1: Check Email Exists
```go
// Check if email already registered
_, err := authIdentifierRepo.GetByIdentifier(ctx, email, "PASSWORD")
if err == nil {
    return error("email already exists")
}
```

### Step 2: Create User
```go
user := models.NewUser(email, passwordHash)
userRepo.Create(ctx, user)
```

### Step 3: Create User Identity
```go
userIdentity := &models.UserIdentity{
    ID:               uuid.New(),
    UserID:           user.ID,
    IdentityType:     "PASSWORD",
    IdentityValue:    email,
    CredentialSecret: passwordHash,
    IsVerified:       false,
}
userIdentityRepo.Create(ctx, userIdentity)
```

### Step 4: Create Auth Identifier
```go
authIdentifier := &models.AuthIdentifier{
    TenantID:       user.TenantID,
    IdentifierHash: auth.HashIdentifier(email), // SHA256 hash
    UserID:         user.ID,
    IdentityID:     userIdentity.ID,
    IdentifierType: "PASSWORD",
    OriginalValue:  &email, // Optional, for debugging
}
authIdentifierRepo.Create(ctx, authIdentifier)
```

## Benefits of This Architecture

### 1. Multi-Provider Support
- Single user can have multiple identities (password, Google, GitHub, etc.)
- Each identity stored separately in `user_identities`
- All mapped to same user_id via `auth_identifiers`

### 2. Identifier Flexibility
- Email can change without breaking authentication
- Phone number can be added as alternative login
- Social OAuth IDs stored separately

### 3. Security
- Identifier hashing prevents enumeration attacks
- Credentials isolated from user table
- Easy to implement MFA per identity

### 4. Tenant Isolation
- `auth_identifiers` partitioned by tenant_id
- Fast lookups within tenant
- Supports multi-tenancy

## Example: Adding Google OAuth

### Create Google Identity
```go
userIdentity := &models.UserIdentity{
    UserID:           existingUser.ID,
    IdentityType:     "GOOGLE",
    IdentityValue:    googleUserID,
    CredentialSecret: googleAccessToken,
    Metadata:         googleProfileData,
    IsVerified:       true, // OAuth is pre-verified
}
```

### Create Auth Identifier for Google Email
```go
authIdentifier := &models.AuthIdentifier{
    TenantID:       user.TenantID,
    IdentifierHash: auth.HashIdentifier(googleEmail),
    UserID:         user.ID,
    IdentityID:     userIdentity.ID,
    IdentifierType: "GOOGLE",
    OriginalValue:  &googleEmail,
}
```

## Security Considerations

1. **Identifier Hashing**: Always hash identifiers before storing in `identifier_hash`
2. **Password Hashing**: Use bcrypt for `credential_secret` when type is PASSWORD
3. **Rate Limiting**: Implement rate limiting on login attempts
4. **Failed Attempts**: Track failed attempts in `users.failed_login_attempts`
5. **Account Locking**: Implement temporary locks via `users.locked_until`

## API Endpoints

### POST /api/v1/auth/login
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

### POST /api/v1/auth/register
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "first_name": "John",
  "last_name": "Doe"
}
```

### POST /api/v1/auth/refresh
```json
{
  "refresh_token": "..."
}
```

## Error Handling

All authentication errors return generic "invalid credentials" message to prevent user enumeration:

```go
// Don't reveal which step failed
if err != nil {
    return fmt.Errorf("invalid credentials")
}
```

## Future Enhancements

1. **Email Verification**: Set `is_verified=false` on registration, require email verification
2. **MFA**: Add `user_mfa_methods` table, check during login
3. **Password Reset**: Use `user_identities` to update credential_secret
4. **Social Login**: Add handlers for Google, GitHub, Microsoft OAuth
5. **Passwordless**: Add MAGIC_LINK identity type
