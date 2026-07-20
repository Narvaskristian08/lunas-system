# LUNAS  
### Automated Urban Infrastructure Maintenance and Monitoring System

**LUNAS** is an automated cloud-native platform for urban infrastructure monitoring and maintenance. It integrates Edge AI, secure web-native workflows, and encrypted object storage to automate the detection, verification, and SLA-based escalation of infrastructure incidents. LUNAS enables citizens, repair crews, and government agencies to collaboratively maintain urban infrastructure efficiently and transparently.

---

## Core Features

- **Edge AI Monitoring:** On-device **TensorFlow Lite (TFLite)** models perform real-time anomaly detection (≥90% confidence), identifying hazards such as utility risks, road damage, drainage failure, and structural decay.  
- **Privacy by Design:** Automatic **PII redaction** (faces, license plates) ensures compliance with the **Philippines Data Privacy Act of 2012**.  
- **Automated SLA Governance:** A centralized serverless orchestration engine enforces jurisdiction-based SLAs with automated, time-triggered escalation for unresolved incidents.
- **Operational Efficiency:** **Spatiotemporal clustering** aggregates duplicate reports into single **Incident IDs**, optimizing resources.  
- **Tamper-Evident Audit Ledger:** Cryptographically signed logs ensure immutable activity tracking to support transparent performance and reputation monitoring.

---

## Platform Architecture

### Mobile Client (Flutter)
- On-device AI inference and **real-time anomaly detection**  
- Hardware-backed **geolocation verification**  
- Tamper-resistant report submissions

### Centralized Backend & Orchestration
- **RESTful API / WebSockets** for low-latency incident routing and dashboard updates
- **Serverless Cron Jobs / Workers** for continuous SLA monitoring and automated escalation triggers
- Asymmetric cryptography (e.g., Ed25519) to manage and validate user/agency identities

### Secure Storage Layer
| Layer | Purpose | Technology |
|-------|---------|------------|
| Relational Database | Core system state, incident tracking, metadata | PostgreSQL (with Append-Only Audit Triggers) |
| Cloud Object Storage | Encrypted media storage, pre and post-repair evidence | AWS S3 / Google Cloud Storage (via Pre-signed URLs) |

### Command Center & Verification Loop 
- Administrative dashboard acting as the centralized authority hub.
- Incident closure requires a **2-of-3 digital signature loop:** Repair Crew Signature + AI Computer Vision Verification + Government Official Sign-off.
- Uses **Structural Similarity Index (SSIM)** to compare pre and post-repair states before a task is officially marked as settled

---

## Service Level Agreements (SLAs)

| Level | Response Time | Scope |
|-------|---------------|------|
| City | 24–48 hours | Major infrastructure, arterial roads, high-risk hazards |
| Barangay | 7 days | Local maintenance, community assets, minor repairs |

- Breached Barangay SLAs automatically escalate unresolved incidents to **City dashboards**.  

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Mobile | Flutter, Dio HTTP Client |
| Edge AI | TensorFlow Lite (TFLite) |
| Backend & API | Node.js / Go / Python (FastAPI) |
| Database & Ledger | PostgreSQL (with transactional audit logs) |
| Storage | Cloud Object Storage (S3 / GCS) |
| Verification | Structural Similarity Index (SSIM), Asymmetric Cryptography (Ed25519) |

---

## SDG Alignment

- **SDG 11 – Sustainable Cities and Communities:** Enhances urban infrastructure resilience through automated, real-time monitoring. 
- **SDG 16 – Peace, Justice, and Strong Institutions:** Promotes institutional accountability through transparent, tamper-evident SLA tracking. 
- **SDG 9 – Industry, Innovation, and Infrastructure:** Modernizes local governance frameworks using scalable AI and web-native architectures.

---

## Vision

Enable AI-assisted, high-efficiency, and verifiable infrastructure governance to vastly improve response times, operational transparency, and urban resilience across local government units..

---

## References (APA 7th Edition)

1. Abadi, M., Agarwal, A., Barham, P., Brevdo, E., Chen, Z., Citro, C., … Zheng, X. (2020). *TensorFlow Lite: Machine learning on mobile and edge devices*. TensorFlow. https://www.tensorflow.org/lite

2. Abu Awwad, Y., Rana, O., & Perera, C. (2024). Anomaly detection on the edge using smart cameras under low-light conditions. *Sensors*, *24*(3), Article 772. [(https://www.mdpi.com/1424-8220/24/3/772)](https://www.mdpi.com/1424-8220/24/3/772)

3. Yasaswini, S., Sai, K. B., Prabhakar, P. V. S., Karthik, Y., & Murthy, G. S. N. (2026). Smart city vision: A geo-tagged AI system of automated road damage detection and civic workflow management. *International Journal of Science and Research Archive*, *18*(2), 903–909. [https://doi.org/10.30574/ijsra.2026.18.2.0365](https://ijsra.net/content/smart-city-vision-geo-tagged-ai-system-automated-road-damage-detection-and-civic-workflow)

4. Mutambik, I. (2024). Assessing urban vulnerability to emergencies: A spatiotemporal approach using K-means clustering. *Land*, *13*(11), Article 1744. [(https://www.mdpi.com/3010868)](https://www.mdpi.com/2073-445X/13/11/1744)

5. Republic of the Philippines. (2012). *Data Privacy Act of 2012 (RA 10173)*. Official Gazette. https://www.privacy.gov.ph/data-privacy-act/
