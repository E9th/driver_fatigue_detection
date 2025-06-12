# API Reference Documentation

## Firebase Services

### lib/firebase.ts
Core Firebase operations and real-time data subscriptions.

#### Functions

##### `subscribeToCurrentData(deviceId, callback)`
**Purpose**: Subscribe to real-time device status updates
**Parameters**:
- `deviceId` (string): Device identifier (e.g., "device_01")
- `callback` (function): Function called when data updates

**Returns**: Unsubscribe function
**Firebase Path**: `devices/{deviceId}/current_data`
**Update Frequency**: Real-time (1-3 seconds)

\`\`\`typescript
const unsubscribe = subscribeToCurrentData("device_01", (data) => {
  console.log("Current status:", data?.status)
})
\`\`\`

##### `subscribeToHistoricalData(deviceId, startDate, endDate, callback)`
**Purpose**: Subscribe to historical data with date filtering
**Parameters**:
- `deviceId` (string): Device identifier
- `startDate` (string): Start date (YYYY-MM-DD)
- `endDate` (string): End date (YYYY-MM-DD)
- `callback` (function): Function called with filtered data array

**Returns**: Unsubscribe function
**Firebase Path**: `devices/{deviceId}/history`
**Data Limit**: 200 most recent records

##### `getDeviceCount()`
**Purpose**: Get total number of devices in system
**Returns**: Promise<number>
**Firebase Path**: `devices/`

##### `getActiveDeviceCount()`
**Purpose**: Get number of devices active in last 5 minutes
**Returns**: Promise<number>
**Firebase Path**: `devices/`

##### `getUsedDeviceIds()`
**Purpose**: Get list of device IDs currently assigned to users
**Returns**: Promise<string[]>
**Firebase Path**: `users/`

### lib/auth.ts
Authentication and user management operations.

#### Functions

##### `registerUser(userData)`
**Purpose**: Register new user with device assignment
**Parameters**: RegisterData object
**Returns**: Promise<AuthResponse>
**Firebase Paths**: 
- `auth/` (Firebase Auth)
- `users/{uid}` (User profile)

##### `loginUser(email, password)`
**Purpose**: Authenticate user login
**Returns**: Promise<AuthResponse>
**Firebase Path**: `auth/` (Firebase Auth)

##### `getUserProfile(uid)`
**Purpose**: Get user profile data
**Returns**: Promise<UserProfile | null>
**Firebase Path**: `users/{uid}`

##### `getAllUsers()`
**Purpose**: Get all users (Admin only)
**Returns**: Promise<UserProfile[]>
**Firebase Path**: `users/`

##### `deleteUser(uid)`
**Purpose**: Delete user and release device (Admin only)
**Returns**: Promise with success status and released deviceId
**Firebase Path**: `users/{uid}`

### lib/data-service.ts
Data processing, caching, and analytics.

#### Functions

##### `subscribeToHistoricalDataWithCache(deviceId, startDate, endDate, callback)`
**Purpose**: Get historical data with intelligent caching
**Cache Duration**: 5 minutes
**Data Processing**: Filters, sorts, and calculates statistics
**Returns**: Unsubscribe function

##### `generateReport(data, period)`
**Purpose**: Generate comprehensive analytics report
**Parameters**:
- `data` (HistoricalData[]): Historical data array
- `period` ("daily" | "weekly" | "monthly"): Report period

**Returns**: ReportData with stats, trends, and recommendations

### lib/admin-analytics.ts
System-wide analytics for administrators.

#### Functions

##### `getSystemStats(startDate, endDate)`
**Purpose**: Get comprehensive system statistics
**Returns**: Promise<SystemStats>
**Data Sources**:
- `devices/` (device counts)
- `users/` (user counts)
- Historical data from all devices

## Data Processing Pipeline

### 1. Raw Data Collection
- IoT devices send data every 1-3 seconds
- Data stored in Firebase Realtime Database
- Real-time listeners update UI immediately

### 2. Data Transformation
- Raw Firebase data → TypeScript interfaces
- Date filtering and sorting
- Status normalization (Thai translations)

### 3. Analytics Processing
- Event counting (yawns, drowsiness, alerts)
- EAR (Eye Aspect Ratio) calculations
- Session detection (10-minute gaps)
- Risk score calculation (0-100 scale)

### 4. Caching Strategy
- 5-minute cache for historical data
- Automatic cache invalidation
- Memory cleanup on component unmount

## Error Handling

### Firebase Connection Errors
- Automatic fallback to cached data
- Development mode with localStorage
- Comprehensive error logging

### Data Validation
- Type checking with TypeScript
- Null/undefined safety
- Invalid data filtering

### Performance Monitoring
- Firebase usage tracking
- Cache hit/miss ratios
- Active listener counting
