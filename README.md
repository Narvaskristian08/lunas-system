# LUNAS  
### Automated Urban Infrastructure Maintenance and Monitoring System

**LUNAS** is a decentralized platform for **urban infrastructure monitoring and maintenance**. It integrates **Edge AI, blockchain smart contracts, and decentralized storage** to automate detection, verification, and SLA-based escalation of infrastructure incidents. LUNAS enables **citizens, repair crews, and government agencies** to collaboratively maintain urban infrastructure efficiently and transparently.

---

## Core Features

- **Edge AI Monitoring:** On-device **TensorFlow Lite (TFLite)** models perform real-time anomaly detection (≥90% confidence), identifying hazards such as utility risks, road damage, drainage failure, and structural decay.  
- **Privacy by Design:** Automatic **PII redaction** (faces, license plates) ensures compliance with the **Philippines Data Privacy Act of 2012**.  
- **Smart Contract Governance:** **Polygon smart contracts** enforce jurisdiction-based SLAs with automated escalation for unresolved incidents.  
- **Operational Efficiency:** **Spatiotemporal clustering** aggregates duplicate reports into single **Incident IDs**, optimizing resources.  
- **Immutable Ledger:** Device-attested blockchain records ensure **tamper-proof reporting** and support **reputation monitoring**.  

---

## Platform Architecture

### Mobile Client (Flutter)
- On-device AI inference and **real-time anomaly detection**  
- Hardware-backed **geolocation verification**  
- Tamper-resistant report submissions  

### Smart Contracts (Solidity)
- SLA enforcement on **Polygon blockchain**  
- **Meta-transactions (EIP-2771)** for gasless reporting  
- **Emergency pause** mechanism during disasters  

### Hybrid Storage
| Layer | Purpose |
|-------|---------|
| Polygon Blockchain | Smart contract execution, SLA state changes |
| IPFS | Encrypted media storage, decentralized evidence |

### Command Center & Oracle (Web)
- Administrative dashboard acts as a **trusted oracle**  
- Incident closure requires **2-of-3 digital signatures**: Repair Crew + AI + Official  

### Verification Loop
- Uses **Structural Similarity Index (SSIM)** to validate repairs  
- Confirms pre- and post-repair states before final task settlement  

---

## Service Level Agreements (SLAs)

| Level | Response Time | Scope |
|-------|---------------|------|
| City | 24–48 hours | Major infrastructure, arterial roads |
| Barangay | 7 days | Local maintenance, community assets |

- Breached Barangay SLAs automatically escalate unresolved incidents to **City dashboards**.  

---

## Technology Stack

| Component | Technology |
|-----------|-----------|
| Mobile | Flutter |
| Edge AI | TensorFlow Lite |
| Blockchain | Polygon |
| Smart Contracts | Solidity |
| Storage | IPFS |
| Verification | Structural Similarity Index (SSIM) |

---

## SDG Alignment

- **SDG 11 – Sustainable Cities and Communities:** Enhances urban infrastructure resilience through automated monitoring.  
- **SDG 16 – Peace, Justice, and Strong Institutions:** Promotes accountability with immutable SLA records.  
- **SDG 9 – Industry, Innovation, and Infrastructure:** Modernizes governance using **AI** and decentralized technologies.  

---

## Vision

Enable **AI-assisted, decentralized, and verifiable infrastructure governance** to improve **response efficiency, operational transparency, and urban resilience**.

---

## References (APA 7th Edition)

1. Abadi, M., Agarwal, A., Barham, P., Brevdo, E., Chen, Z., Citro, C., … Zheng, X. (2020). *TensorFlow Lite: Machine learning on mobile and edge devices*. TensorFlow. [https://www.tensorflow.org/lite](https://www.tensorflow.org/lite)

2. Buterin, V. (2014). *Ethereum whitepaper: A next-generation smart contract and decentralized application platform*. Ethereum. [https://ethereum.org/en/whitepaper/](https://ethereum.org/en/whitepaper/)

3. Wood, G. (2016). *Polkadot: Vision for a heterogeneous multi-chain framework*. Polkadot Network. [https://polkadot.network/PolkaDotPaper.pdf](https://polkadot.network/PolkaDotPaper.pdf)

4. Protocol Labs. (2023). *IPFS: InterPlanetary File System documentation*. Protocol Labs. [https://docs.ipfs.io/](https://docs.ipfs.io/)

5. Wang, Z., & Bovik, A. C. (2004). Image quality assessment: From error visibility to structural similarity. *IEEE Transactions on Image Processing, 13*(4), 600–612. [https://ieeexplore.ieee.org/document/1284395](https://ieeexplore.ieee.org/document/1284395)

6. Republic of the Philippines. (2012). *Data Privacy Act of 2012 (RA 10173)*. Official Gazette. [https://www.privacy.gov.ph/data-privacy-act/](https://www.privacy.gov.ph/data-privacy-act/)
