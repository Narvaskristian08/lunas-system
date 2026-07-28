



````md
# 🌙 LUNAS
### AI-Assisted Urban Infrastructure Maintenance and Monitoring System with Automated SLA Management

LUNAS is a cloud-based infrastructure reporting and maintenance platform designed to improve how urban infrastructure issues are reported, managed, assigned, monitored, and resolved.

The system empowers **citizens**, **repair personnel**, and **government officials** through a unified platform that combines AI-assisted image analysis, automated Service Level Agreement (SLA) monitoring, and transparent maintenance workflows. It aims to provide a faster, more accountable, and data-driven approach to infrastructure maintenance in **Dagupan City, Philippines**. fileciteturn0file0

---

# 📖 Overview

Urban infrastructure issues such as potholes, damaged roads, utility leaks, drainage problems, and other public hazards often experience delayed reporting, poor monitoring, and lack of accountability.

LUNAS addresses these challenges by providing:

- AI-assisted incident reporting
- Role-based mobile application
- Web-based administrative command center
- Automated work order management
- SLA monitoring and escalation
- Repair verification
- Privacy-preserving image processing
- Complete audit logging

The system follows a complete **Report → Validation → Assignment → Repair → Verification → Closure** workflow. fileciteturn0file0

---

# 🎯 Objectives

The project aims to:

- Develop a role-based mobile application for different users.
- Build a web-based command center for incident management.
- Implement AI-assisted hazard detection and image privacy protection.
- Automate incident routing, work order creation, and SLA monitoring.
- Improve transparency using repair verification and audit logs. fileciteturn0file0

---

# 👥 User Roles

## 👤 Citizen

- Report infrastructure incidents
- Capture and upload evidence
- AI-assisted hazard detection
- Automatic privacy masking
- Track report progress
- Receive notifications
- View completed repairs

---

## 👷 Repair Personnel

- Receive assigned work orders
- View incident information
- Navigate to incident location
- Update repair progress
- Upload repair evidence
- Digitally submit completed work

---

## 🏛️ Barangay Officials

- Validate submitted reports
- Verify incident details
- Assign local maintenance tasks
- Review repair evidence
- Approve or reject repairs
- Monitor SLA compliance

---

## 🏢 City Engineering Office

- Manage city-wide infrastructure
- Assign work orders
- Monitor incident status
- Review analytics
- Verify completed repairs
- Monitor SLA performance

---

## 🔧 Utility Providers

- Receive utility-related incidents
- Perform repairs
- Submit repair completion
- Coordinate with LGU

---

## 👨‍💼 System Administrator

- Manage users and permissions
- Configure SLA rules
- System configuration
- Monitor audit logs
- Manage categories
- Generate reports

---

# 🚀 Key Features

## 📍 Smart Incident Reporting

- GPS location capture
- Photo upload
- AI-assisted hazard recognition
- Automatic hazard categorization
- Duplicate report detection
- Image quality checking

---

## 🤖 AI-Assisted Image Processing

- TensorFlow Lite hazard detection
- On-device image analysis
- Privacy-preserving processing
- Automatic face detection
- Automatic license plate detection
- Automatic image redaction

---

## 🗺️ Incident Mapping

- Google Maps integration
- Incident visualization
- Location confirmation
- Jurisdiction identification

---

## 📋 Work Order Management

- Automatic assignment workflow
- Personnel assignment
- Status updates
- Repair progress tracking
- Completion records

---

## ⏰ Automated SLA Monitoring

- Configurable SLA rules
- Deadline tracking
- Automatic reminders
- Escalation system
- Resolution monitoring

---

## ✅ Repair Verification

- Before vs After comparison
- Image alignment
- Structural Similarity Index (SSIM)
- Human-supervised approval
- Repair recommendation

---

## 🔔 Notifications

- Work order notifications
- Status updates
- SLA reminders
- Approval notifications
- Resolution updates

---

## 🔒 Security

- JWT Authentication
- Role-based authorization
- Audit logs
- Ed25519 digital signatures
- Secure cloud storage
- Tamper-evident records

---

# 🔄 System Workflow

```text
Citizen Reports Incident
          │
          ▼
AI Image Analysis
(Hazard Detection + Privacy Masking)
          │
          ▼
Submit Report
          │
          ▼
Incident Validation
          │
          ▼
Duplicate Check
          │
          ▼
Jurisdiction Identification
          │
          ▼
Work Order Creation
          │
          ▼
Personnel Assignment
          │
          ▼
Repair Progress
          │
          ▼
Repair Evidence Upload
          │
          ▼
AI Repair Verification
          │
          ▼
Official Review
          │
          ▼
Approve / Reject
          │
          ▼
Incident Closed
```

---

# 📱 Platforms

## Mobile Application

Used by:

- Citizens
- Repair Personnel
- Authorized Officials

Functions:

- Report incidents
- Perform repairs
- Track reports
- Receive notifications
- Verify repairs

---

## Web Command Center

Used by:

- Barangay Officials
- City Engineering Office
- Utility Providers
- Administrators

Functions:

- Incident validation
- Assignment management
- SLA monitoring
- Analytics
- Reporting
- Verification
- Administration

---

# 🛠 Technology Stack

| Component | Technology |
|------------|------------|
| Mobile | Flutter (Dart) |
| Web | Next.js (React) |
| Backend | FastAPI (Python) |
| Database | PostgreSQL |
| Cloud Storage | Amazon S3 |
| AI Framework | TensorFlow Lite |
| Computer Vision | OpenCV |
| Image Similarity | SSIM |
| Authentication | JWT |
| Digital Signature | Ed25519 |
| Maps | Google Maps API |
| Notifications | Firebase Cloud Messaging |
| Version Control | GitHub |

---

# 📊 SLA Levels

| Priority | Example Incidents | Target Resolution |
|-----------|------------------|-------------------|
| 🔴 Critical | Road collapse, electrical hazards, major flooding | 24–48 Hours |
| 🟠 High | Large potholes, major water leaks | 3 Days |
| 🟡 Medium | Road cracks, drainage blockage | 7 Days |
| 🟢 Low | Minor maintenance issues, faded road markings | 14 Days |

---

# 🏗 System Architecture

```text
                Mobile Application
      (Citizen • Repair • Officials)
                     │
                     ▼
                FastAPI Backend
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 PostgreSQL      Amazon S3      AI Services
  Database      Image Storage   (TensorFlow Lite,
                                OpenCV, SSIM)
                     │
                     ▼
          Web Command Center
 (Barangay • Engineering • Admin)
```

---

# 🎯 Expected Outcomes

LUNAS is expected to deliver:

- A unified infrastructure reporting platform
- Faster incident response and resolution
- Automated SLA monitoring
- AI-assisted report validation
- Transparent maintenance records
- Better accountability through audit logs
- Increased citizen participation
- Improved decision-making through centralized data management fileciteturn0file0

---

# 👥 Beneficiaries

- Citizens
- Repair Personnel
- Barangay Officials
- City Engineering Office
- Utility Providers
- Local Government Unit (LGU) fileciteturn0file0

---

# 👨‍💻 Development Team

| Name | Role |
|------|------|
| Mark Khean M. Viari | Project Manager • System Integrator |
| Terrence Lappay | System Analyst • UI/UX |
| Mark Anthony Lafuente | System Analyst • Frontend |
| Kristian Dave Narvas | System Integrator |
| John Miller Ungos | System Integrator |

---

# 📄 Research Information

**Title**

> **LUNAS: An AI-Assisted Urban Infrastructure Maintenance and Monitoring System with Automated SLA Management**

**Institution**

PHINMA University of Pangasinan  
College of Information Technology

**Project Duration**

March 2026 – July 2026

**Location**

Dagupan City, Philippines fileciteturn0file0

---

# 📜 License

This project is developed as a Capstone Research Project for academic purposes under the College of Information Technology, PHINMA University of Pangasinan.

---

> **LUNAS** — *Building smarter, faster, and more transparent urban infrastructure maintenance through AI and automation.*
````