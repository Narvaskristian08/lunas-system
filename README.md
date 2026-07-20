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

2. Abu Awwad, Y., Rana, O., & Perera, C. (2024). Anomaly detection on the edge using smart cameras under low-light conditions. *Sensors*, *24*(3), Article 772. https://doi.org/10.3390/s24030772

3. Bai, T., Fu, S., & Yang, Q. (2022). Privacy-preserving object detection with secure convolutional neural networks for vehicular edge computing. *Future Internet*, *14*(11), Article 316. https://doi.org/10.3390/fi14110316

4. Mutambik, I. (2024). Assessing urban vulnerability to emergencies: A spatiotemporal approach using K-means clustering. *Land*, *13*(11), Article 1744. https://doi.org/10.3390/land13111744

5. Wang, Z., & Bovik, A. C. (2004). Image quality assessment: From error visibility to structural similarity. *IEEE Transactions on Image Processing*, *13*(4), 600–612. https://doi.org/10.1109/TIP.2004.838387

6. Republic of the Philippines. (2012). *Data Privacy Act of 2012 (RA 10173)*. Official Gazette. https://www.privacy.gov.ph/data-privacy-act/
