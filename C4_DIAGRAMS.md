# LUNAS System - C4 Architecture Diagrams

## C1 - System Context Diagram

```mermaid
C4Context
    title C1 - System Context Diagram

    Person(citizen, "Citizen", "Reports issues")
    Person(repair, "Repair", "Does repairs")
    Person(barangay, "Barangay", "Validates")
    Person(engineer, "Engineer", "Manages")
    Person(utility, "Utility", "Utilities")
    Person(admin, "Admin", "Config")

    System(lunas, "LUNAS", "AI Infrastructure System")

    System_Ext(maps, "Maps", "Location")
    System_Ext(push, "OneSignal", "Notifs")
    System_Ext(store, "Supabase", "Storage")

    Rel(citizen, lunas, "Report")
    Rel(repair, lunas, "Update")
    Rel(barangay, lunas, "Validate")
    Rel(engineer, lunas, "Manage")
    Rel(utility, lunas, "Repair")
    Rel(admin, lunas, "Configure")

    Rel(lunas, maps, "Location")
    Rel(lunas, push, "Push")
    Rel(lunas, store, "Files")

    UpdateLayoutConfig($c4ShapeInRow="3", $c4BoundaryInRow="1")
```

---

## C2 - Container Diagram

```mermaid
C4Container
    title Container Diagram - LUNAS System Architecture

    Person(citizen, "Citizen", "Reports issues")
    Person(repair, "Repair Personnel", "Completes work")
    Person(official, "Officials", "Validates & assigns")
    Person(admin, "Admin", "Manages system")

    Container_Boundary(lunas, "LUNAS System") {
        Container(mobile, "Mobile App", "Flutter", "iOS & Android")
        Container(web, "Web Dashboard", "Next.js", "Admin interface")
        
        Container(api, "Backend API", "Node.js/Express", "Business logic")
        Container(ai, "AI Service", "Python/Flask", "YOLOv8 detection")
        
        ContainerDb(mongo, "Database", "MongoDB", "Data storage")
    }

    System_Ext(maps, "Google Maps", "Location services")
    System_Ext(onesignal, "OneSignal", "Push gateway")
    System_Ext(supabase, "Supabase", "File storage")

    Rel(citizen, mobile, "Uses")
    Rel(repair, mobile, "Uses")
    Rel(official, web, "Uses")
    Rel(admin, web, "Uses")

    Rel(mobile, api, "REST API")
    Rel(web, api, "REST API")

    Rel(api, ai, "Image analysis")
    Rel(api, mongo, "Read/Write")
    Rel(api, maps, "Geolocation")
    Rel(api, onesignal, "Push notifs")
    Rel(api, supabase, "File ops")

    UpdateRelStyle(citizen, mobile, $offsetY="-40", $offsetX="-50")
    UpdateRelStyle(repair, mobile, $offsetY="-40", $offsetX="50")
    UpdateRelStyle(official, web, $offsetY="-40", $offsetX="-50")
    UpdateRelStyle(admin, web, $offsetY="-40", $offsetX="50")
```

---

## Alternative C2 - Container Diagram (Detailed)

```mermaid
C4Container
    title Container Diagram - LUNAS System (Detailed View)

    Person(users, "System Users", "All user types")

    Container_Boundary(frontend, "Client Layer") {
        Container(mobile, "Mobile App", "Flutter", "Incident reporting")
        Container(web, "Web Dashboard", "Next.js", "Admin panel")
    }

    Container_Boundary(backend, "Application Layer") {
        Container(api, "REST API", "Node.js", "Core logic")
        Container(auth, "Auth Service", "JWT", "Authentication")
        Container(sla, "SLA Monitor", "Cron", "Deadline tracking")
        Container(notif, "Notif Service", "OneSignal", "Push messages")
    }

    Container_Boundary(ai_layer, "AI/ML Layer") {
        Container(ai, "AI Service", "YOLOv8", "Damage detection")
        Container(privacy, "Privacy Filter", "OpenCV", "Face masking")
        Container(verify, "Repair Verify", "SSIM", "Image compare")
    }

    Container_Boundary(data, "Data Layer") {
        ContainerDb(mongo, "Database", "MongoDB", "Core data")
        ContainerDb(storage, "File Storage", "Supabase", "Images")
        ContainerDb(cache, "Cache", "Memory", "Sessions")
    }

    System_Ext(maps, "Maps API", "Location")
    System_Ext(signal, "OneSignal", "Push")

    Rel(users, mobile, "Uses")
    Rel(users, web, "Uses")

    Rel(mobile, api, "REST")
    Rel(web, api, "REST")

    Rel(api, auth, "Validate")
    Rel(api, sla, "Check")
    Rel(api, notif, "Send")
    Rel(api, ai, "Analyze")

    Rel(ai, privacy, "Mask")
    Rel(ai, verify, "Compare")

    Rel(api, mongo, "CRUD")
    Rel(api, storage, "Files")
    Rel(api, cache, "Cache")

    Rel(api, maps, "Location")
    Rel(notif, signal, "Push")

    UpdateLayoutConfig($c4ShapeInRow="2", $c4BoundaryInRow="1")
```

---

## How to Use These Diagrams

### Option 1: Mermaid Live Editor
1. Copy any diagram code above
2. Go to https://mermaid.live
3. Paste the code
4. Export as PNG/SVG

### Option 2: GitHub/GitLab
These diagrams will render automatically in Markdown files on GitHub/GitLab

### Option 3: VS Code
Install the "Markdown Preview Mermaid Support" extension

### Option 4: Documentation Tools
- Notion - supports Mermaid diagrams
- Confluence - via Mermaid plugin
- Docusaurus - native support

---

## Diagram Explanations

### C1 - System Context
Shows the LUNAS system as a single box with:
- **Actors:** 6 user types (Citizen, Repair Personnel, Barangay Official, City Engineer, Utility Provider, Admin)
- **External Systems:** Google Maps (location), OneSignal (notifications), Supabase (storage)
- **Relationships:** How users and systems interact via HTTPS/REST APIs

### C2 - Container Diagram
Shows internal structure:
- **Frontend:** Mobile app (Flutter) + Web dashboard (Next.js)
- **Backend:** Node.js/Express REST API
- **AI Service:** Python/Flask microservice with YOLOv8
- **Database:** MongoDB for structured data
- **Storage:** Supabase for images and files
- **External:** Google Maps, OneSignal

### Key Technologies
- **Mobile:** Flutter (iOS + Android)
- **Web:** Next.js/React
- **Backend:** Node.js + Express.js
- **AI/ML:** Python + Flask + YOLOv8 + PyTorch
- **Database:** MongoDB
- **Storage:** Supabase
- **Notifications:** OneSignal
- **Containerization:** Docker + Docker Compose

---

## System Features Highlighted

✅ **AI-Assisted Detection** - 85-90% accuracy on road damage  
✅ **Privacy Protection** - Automatic face/license plate masking  
✅ **Automated SLA** - Deadline tracking with escalation  
✅ **Role-Based Access** - 6 user types with specific permissions  
✅ **Real-Time Notifications** - Push notifications via OneSignal  
✅ **Geospatial Queries** - Location-based incident mapping  
✅ **Audit Logging** - Complete activity trail  
✅ **Repair Verification** - SSIM-based before/after comparison  

---

## Next Steps

For more detailed diagrams:
- **C3 - Component Diagram:** Break down each container into components
- **C4 - Code Diagram:** Class diagrams for specific features
- **Deployment Diagram:** Infrastructure and server architecture
- **Sequence Diagrams:** Workflow processes (report → repair → verify)

