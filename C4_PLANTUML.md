# LUNAS System - C4 Architecture Diagrams (PlantUML)

## How to Use PlantUML

### Option 1: Online (Easiest)
1. Copy the code below
2. Go to: https://www.plantuml.com/plantuml/uml/
3. Paste and click "Submit"
4. Download as PNG/SVG

### Option 2: VS Code
1. Install "PlantUML" extension
2. Open this file
3. Press `Alt+D` or right-click → "Preview Current Diagram"
4. Export as image

### Option 3: Local CLI
```bash
# Install PlantUML
brew install plantuml  # macOS
# or download from https://plantuml.com/download

# Generate diagram
plantuml C4_PLANTUML.md
```

---

## C1 - System Context Diagram

```plantuml
@startuml C1_SystemContext
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Context.puml

LAYOUT_WITH_LEGEND()

title System Context Diagram - LUNAS Infrastructure Maintenance System

Person(citizen, "Citizen", "Reports infrastructure issues and tracks repair progress")
Person(repair, "Repair Personnel", "Receives and completes assigned work orders")
Person(barangay, "Barangay Official", "Validates incident reports and assigns local maintenance tasks")
Person(engineer, "City Engineer", "Manages city-wide infrastructure and oversees work orders")
Person(utility, "Utility Provider", "Handles utility-related incidents and repairs")
Person(admin, "System Administrator", "Manages users, SLA rules, and system configuration")

System(lunas, "LUNAS System", "AI-Assisted Urban Infrastructure Maintenance and Monitoring System with Automated SLA Management")

System_Ext(maps, "Google Maps API", "Provides geolocation and mapping services")
System_Ext(onesignal, "OneSignal", "Delivers push notifications to mobile users")
System_Ext(supabase, "Supabase", "Cloud storage for images and real-time data synchronization")

Rel(citizen, lunas, "Reports incidents and tracks progress", "HTTPS")
Rel(repair, lunas, "Receives work orders and updates progress", "HTTPS")
Rel(barangay, lunas, "Validates reports and assigns work", "HTTPS")
Rel(engineer, lunas, "Manages city-wide incidents", "HTTPS")
Rel(utility, lunas, "Handles utility repairs", "HTTPS")
Rel(admin, lunas, "Configures system and manages users", "HTTPS")

Rel(lunas, maps, "Validates locations and displays maps", "HTTPS/JSON")
Rel(lunas, onesignal, "Sends push notifications", "REST API")
Rel(lunas, supabase, "Stores and retrieves images", "REST API")

@enduml
```

---

## C2 - Container Diagram

```plantuml
@startuml C2_Container
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_WITH_LEGEND()

title Container Diagram - LUNAS System Architecture

Person(citizen, "Citizen", "Reports infrastructure issues")
Person(repair, "Repair Personnel", "Completes assigned work orders")
Person(official, "Officials", "Barangay Officials, City Engineers, Utility Providers")
Person(admin, "System Administrator", "Manages system configuration")

System_Boundary(lunas, "LUNAS System") {
    Container(mobile, "Mobile Application", "Flutter/Dart", "iOS and Android app for citizens and repair personnel to report and manage incidents")
    Container(web, "Web Dashboard", "Next.js/React", "Web-based admin interface for officials and administrators")
    Container(api, "Backend API", "Node.js/Express", "Handles authentication, business logic, and data management")
    Container(ai, "AI Service", "Python/Flask/YOLOv8", "Road damage detection, crack analysis, and privacy masking")
    ContainerDb(mongo, "Database", "MongoDB", "Stores users, incidents, work orders, and audit logs")
}

System_Ext(maps, "Google Maps API", "Geolocation and mapping services")
System_Ext(onesignal, "OneSignal", "Push notification gateway")
System_Ext(supabase, "Supabase Storage", "Cloud file and image storage")

Rel(citizen, mobile, "Uses", "HTTPS")
Rel(repair, mobile, "Uses", "HTTPS")
Rel(official, web, "Uses", "HTTPS")
Rel(admin, web, "Uses", "HTTPS")

Rel(mobile, api, "Makes API calls to", "REST/HTTPS")
Rel(web, api, "Makes API calls to", "REST/HTTPS")

Rel(api, ai, "Sends images for analysis", "REST/HTTP")
Rel(api, mongo, "Reads from and writes to", "MongoDB Protocol")
Rel(api, maps, "Validates locations with", "REST/HTTPS")
Rel(api, onesignal, "Sends notifications via", "REST/HTTPS")
Rel(api, supabase, "Uploads and downloads images", "REST/HTTPS")

@enduml
```

---

## C2 - Container Diagram (Alternative - With Layers)

```plantuml
@startuml C2_Container_Detailed
!include https://raw.githubusercontent.com/plantuml-stdlib/C4-PlantUML/master/C4_Container.puml

LAYOUT_TOP_DOWN()

title Container Diagram - LUNAS System (Detailed View with Layers)

Person(users, "System Users", "Citizens, Repair Personnel, Officials, Administrators")

System_Boundary(lunas, "LUNAS System") {
    Container_Boundary(frontend, "Client Layer") {
        Container(mobile, "Mobile Application", "Flutter", "Report incidents, manage work orders, receive notifications")
        Container(web, "Web Dashboard", "Next.js", "Admin panel for incident validation and analytics")
    }

    Container_Boundary(backend, "Application Layer") {
        Container(api, "REST API", "Node.js/Express", "Authentication, authorization, and business logic")
        Container(auth, "Auth Service", "JWT", "Token-based authentication and role-based access control")
        Container(sla, "SLA Monitor", "Node-Cron", "Automated deadline tracking and escalation")
        Container(notif, "Notification Service", "OneSignal SDK", "Push notification management")
    }

    Container_Boundary(ai_layer, "AI/ML Layer") {
        Container(ai, "AI Detection Service", "Flask/YOLOv8", "Road damage detection with 85-90% accuracy")
        Container(privacy, "Privacy Masking", "OpenCV", "Face and license plate detection and redaction")
        Container(verify, "Repair Verifier", "SSIM/OpenCV", "Before-after image comparison")
    }

    Container_Boundary(data, "Data Layer") {
        ContainerDb(mongo, "Primary Database", "MongoDB", "Users, incidents, work orders, audit logs")
        ContainerDb(storage, "File Storage", "Supabase", "Images, documents, and repair evidence")
        ContainerDb(cache, "Session Cache", "In-Memory", "Active sessions and temporary data")
    }
}

System_Ext(maps, "Google Maps API", "Geospatial services")
System_Ext(onesignal, "OneSignal Gateway", "Push notification delivery")

Rel(users, mobile, "Uses")
Rel(users, web, "Uses")

Rel(mobile, api, "REST API calls", "HTTPS/JSON")
Rel(web, api, "REST API calls", "HTTPS/JSON")

Rel(api, auth, "Validates tokens")
Rel(api, sla, "Triggers SLA checks")
Rel(api, notif, "Sends notifications")
Rel(api, ai, "Sends images for analysis", "HTTP/JSON")

Rel(ai, privacy, "Detects and masks faces/plates")
Rel(ai, verify, "Validates repair completion")

Rel(api, mongo, "CRUD operations", "MongoDB Protocol")
Rel(api, storage, "Upload/download files", "REST API")
Rel(api, cache, "Session management")

Rel(api, maps, "Location validation", "HTTPS")
Rel(notif, onesignal, "Push delivery", "REST API")

@enduml
```

---

## Comparison: Mermaid vs PlantUML

| Feature | Mermaid | PlantUML |
|---------|---------|----------|
| **Text Wrapping** | ❌ Limited | ✅ Automatic |
| **C4 Support** | ⚠️ Basic | ✅ Official |
| **Spacing** | ❌ Overlaps | ✅ Clean |
| **Layout Control** | ⚠️ Limited | ✅ Flexible |
| **GitHub Render** | ✅ Native | ⚠️ Needs plugin |
| **Output Quality** | ⚠️ Good | ✅ Excellent |
| **Learning Curve** | ✅ Easy | ⚠️ Moderate |

---

## Quick Test

### Test C1 Online:
1. Copy the C1 code above
2. Go to: https://www.plantuml.com/plantuml/uml/
3. Paste in the text box
4. Click "Submit"
5. You'll see a clean diagram with no overlapping text!

### Download Options:
- PNG (for documents/presentations)
- SVG (scalable, for web/posters)
- PDF (for thesis submission)

---

## Color Customization (Optional)

You can customize colors by adding after the `!include` line:

```plantuml
!define PERSON_BG_COLOR #08427B
!define SYSTEM_BG_COLOR #1168BD
!define SYSTEM_EXT_BG_COLOR #999999
!define CONTAINER_BG_COLOR #438DD5
```

---

## Legend

PlantUML C4 diagrams automatically include a legend showing:
- Person (blue)
- System (darker blue)
- External System (gray)
- Container (light blue)
- Relationships (arrows with labels)

---

## VS Code Setup (Optional)

If you want to preview in VS Code:

```bash
# 1. Install PlantUML extension in VS Code
# 2. Install Graphviz (required for PlantUML)
brew install graphviz

# 3. Open this file in VS Code
# 4. Press Alt+D to preview
```

---

## Key Benefits for Your Thesis

✅ **No text overlap** - Clean, professional diagrams  
✅ **High-quality exports** - PNG, SVG, PDF  
✅ **Official C4 support** - Follows C4 model standards  
✅ **Detailed descriptions** - Full text without compression  
✅ **Auto-layout** - Intelligent spacing  
✅ **Legend included** - Automatic color key  
✅ **Version control friendly** - Text-based, works with Git  

