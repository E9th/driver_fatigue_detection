# Firebase Database Schema Documentation

## Database Structure Overview

\`\`\`
driver-fatigue-detection/
├── devices/
│   └── {deviceId}/
│       ├── current_data/          # Real-time device status
│       └── history/               # Historical data records
└── users/                         # User profiles and authentication
    └── {userId}/
\`\`\`

## Tables and Collections

### 1. devices/{deviceId}/current_data
**Purpose**: Store real-time device status and sensor readings
**Update Frequency**: Every 1-3 seconds from IoT device

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| critical_alerts | number | Number of critical alerts | 2 |
| device_id | string | Device identifier | "device_01" |
| drowsiness_events | number | Drowsiness detection count | 5 |
| ear | number | Eye Aspect Ratio (0-1) | 0.25 |
| face_detected_frames | number | Frames with face detected | 150 |
| mouth_distance | number | Mouth opening distance | 12.5 |
| status | string | Current device status | "NORMAL", "YAWN DETECTED", "DROWSINESS DETECTED", "CRITICAL" |
| timestamp | string | ISO timestamp | "2024-01-15T10:30:00.000Z" |
| yawn_events | number | Yawn detection count | 3 |
| system_info | object | Device system information | { device_name, location, version } |

### 2. devices/{deviceId}/history
**Purpose**: Store historical data for analytics and reporting
**Update Frequency**: Every data point from device (1-3 seconds)
**Retention**: Unlimited (consider archiving old data)

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| timestamp | string | ISO timestamp | "2024-01-15T10:30:00.000Z" |
| ear | number | Eye Aspect Ratio | 0.25 |
| yawn_events | number | Yawn count in this record | 1 |
| drowsiness_events | number | Drowsiness count in this record | 0 |
| critical_alerts | number | Critical alert count | 0 |
| device_id | string | Device identifier | "device_01" |
| status | string | Status at this time | "NORMAL" |
| mouth_distance | number | Mouth opening distance | 12.5 |
| face_detected_frames | number | Frames with face detected | 150 |

### 3. users/{userId}
**Purpose**: Store user profiles and device assignments
**Update Frequency**: On registration/profile updates

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| uid | string | User unique identifier | "abc123def456" |
| email | string | User email address | "user@example.com" |
| fullName | string | Full name | "สมชาย ใจดี" |
| phone | string | Phone number | "0812345678" |
| license | string | Driver license number | "12345678" |
| deviceId | string | Assigned device ID | "device_01" |
| role | string | User role | "driver" or "admin" |
| registeredAt | string | Registration timestamp | "2024-01-15T10:30:00.000Z" |
| promotedToAdminAt | string | Admin promotion timestamp | "2024-01-15T10:30:00.000Z" |

## Data Flow

### Real-time Data Flow
1. IoT Device → Firebase Realtime Database (`devices/{deviceId}/current_data`)
2. React Components → Subscribe to current_data changes
3. UI Updates → Display real-time status

### Historical Data Flow
1. IoT Device → Firebase Realtime Database (`devices/{deviceId}/history`)
2. Data Service → Query with date filters
3. Analytics Service → Process and calculate statistics
4. UI Components → Display charts and reports

## Query Patterns

### Common Queries
- Get current device status: `devices/{deviceId}/current_data`
- Get historical data: `devices/{deviceId}/history` (with limitToLast(200))
- Get user profile: `users/{userId}`
- Get all users: `users/` (admin only)
- Check device availability: `users/` (query by deviceId)

### Performance Considerations
- Historical data queries are limited to 200 records
- Data is cached for 5 minutes to reduce Firebase calls
- Real-time listeners are cleaned up on component unmount
