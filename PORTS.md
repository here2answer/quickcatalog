# Port Reference — Development Environment

## Occupied Ports (as of 2026-02-16)

### Docker Desktop (PID 12920) + WSL Relay (PID 1528)
| Port  | Service                          |
|-------|----------------------------------|
| 80    | Nginx / frontend (prod)          |
| 443   | HTTPS (prod)                     |
| 4201  | Angular dev server (prod)        |
| 5432  | PostgreSQL (prod instance 1)     |
| 5433  | PostgreSQL (prod instance 2)     |
| 5434  | PostgreSQL (prod instance 3)     |
| 5435  | PostgreSQL (prod instance 4)     |
| 5440  | PostgreSQL — QuickCatalog dev    |
| 6379  | Redis (prod instance 1)          |
| 6380  | Redis (prod instance 2)          |
| 6381  | Redis (prod instance 3)          |
| 8080  | Backend API (prod)               |
| 8081  | Backend API (prod)               |
| 8082  | Backend API (prod)               |
| 8085  | Backend API (prod)               |
| 8180  | Backend service (prod)           |
| 8280  | Backend service (prod)           |
| 8443  | HTTPS backend (prod)             |
| 8543  | HTTPS backend (prod)             |
| 9000  | MinIO API — QuickCatalog dev     |
| 9001  | MinIO Console — QuickCatalog dev |

### MySQL (PID 6396)
| Port  | Service        |
|-------|----------------|
| 3306  | MySQL          |
| 33060 | MySQL X Proto  |

### Other Services
| Port  | Service                | PID   |
|-------|------------------------|-------|
| 11434 | Ollama (local LLM)     | 6496  |
| 5040  | Windows service        | 8536  |
| 7680  | Windows Update (WUDO)  | 1252  |

### Windows System
| Port  | Service        |
|-------|----------------|
| 135   | RPC            |
| 139   | NetBIOS        |
| 445   | SMB            |
| 2179  | VMConnect      |
| 5357  | WSDAPI         |

---

## QuickCatalog Dev Ports (chosen to avoid conflicts)

| Port  | Service                     |
|-------|-----------------------------|
| 5440  | PostgreSQL                  |
| 9000  | MinIO API                   |
| 9001  | MinIO Console               |
| 8083  | Spring Boot Backend         |
| 4202  | Angular Frontend (ng serve) |

## Available Port Ranges for Future Projects
- **8083-8084, 8086-8099** — backend APIs
- **4202-4299** — Angular dev servers
- **5441-5499** — PostgreSQL instances
- **6382-6399** — Redis instances
- **9002-9099** — Object storage / misc
