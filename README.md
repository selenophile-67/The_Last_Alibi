# 🕵️ THE LAST ALIBI
### An Immersive Detective Mystery, Crime Investigation & Psychological Thriller Game

**Everyone has an alibi. The question is, whose alibi is worth believing?**

---

## 📌 About The Project

**The Last Alibi** is a story-driven detective mystery game that puts players in the shoes of an experienced investigator tasked with solving a series of mysterious crimes in the fictional city of Ravenwood.

A series of seemingly unrelated murders has left the city terrified. Every crime scene contains hidden clues, every suspect has a secret, and every witness tells a different version of the truth.

As Detective Alex Morgan, players must investigate crime scenes, collect evidence, analyze forensic reports, interrogate suspects, connect clues, and uncover the truth behind a mysterious criminal known as **The Phantom**.

But be careful: not every suspect is guilty, not every clue is genuine, and not every decision can be undone.

The game combines crime investigation, logical reasoning, psychological interrogation, interactive storytelling, and decision-based gameplay to deliver an engaging detective experience.

## ✨ Key Features

### 🔍 1. Interactive Crime Scene Investigation
- Explore detailed and mysterious crime scenes.
- Examine suspicious objects and surroundings.
- Discover hidden documents, fingerprints, and other evidence.
- Investigate abandoned buildings, hotels, railway stations, and more.
- Photograph and collect important clues.
- Discover optional evidence that can unlock additional story details.

### 🧪 2. Evidence Collection & Forensic Analysis
- Collect physical, digital, documentary, and forensic evidence.
- Examine fingerprints, weapons, DNA samples, and bloodstains.
- Analyze CCTV footage, phone records, and suspicious messages.
- Maintain a centralized evidence inventory.
- Connect evidence to suspects and crime locations.

### 🗣️ 3. Advanced Suspect Interrogation
- Question multiple suspects with different personalities.
- Present collected evidence during interrogations.
- Identify contradictions in suspect statements.
- Discover hidden motives and suspicious relationships.
- Influence conversations through player decisions.
- Experience different dialogue paths depending on investigation progress.

### 🧩 4. Detective Investigation Board
- Organize collected evidence visually.
- Connect suspects, victims, locations, and clues.
- Build theories and investigate relationships.
- Discover connections between seemingly unrelated events.
- Use logical deductions to identify potential criminals.

### ⏳ 5. Timeline Reconstruction
- Reconstruct events leading up to each crime.
- Compare witness statements with verified evidence.
- Track suspect movements and important timestamps.
- Identify contradictions in alibis.
- Discover the actual sequence of events.

### 🎭 6. Decision-Based Storytelling
Every decision can influence the investigation.

- Accuse suspects based on available evidence.
- Decide whom to trust.
- Reveal or conceal confidential information.
- Follow alternative investigation paths.
- Experience different case outcomes.
- Unlock multiple endings based on player decisions.

### 🏆 7. Detective Progression System
Improve your investigative abilities through experience and successful deductions.

Available skills include:
- Observation
- Interrogation
- Forensic Analysis
- Logical Reasoning
- Digital Investigation

Unlock new investigation opportunities as you progress.

### 🏢 8. Interactive Detective Headquarters
A central investigation hub featuring:
- Evidence storage.
- Investigation board.
- Computer terminal.
- Case files.
- Telephone.
- Newspaper archive.
- Laboratory reports.

### 🔐 9. Puzzles & Mini-Games
Solve different challenges, including:
- Password cracking.
- Safe unlocking.
- Fingerprint matching.
- DNA comparison.
- Cipher decoding.
- CCTV analysis.
- Audio recording enhancement.
- Hidden message discovery.

### 🌆 10. Atmospheric Noir Experience
- Dark detective-themed visual design.
- Mysterious locations and environments.
- Suspenseful background music.
- Cinematic transitions.
- Atmospheric sound effects.
- Immersive storytelling.

---

## 📖 Storyline & Investigation Cases

The game features five major investigation cases, each containing unique suspects, locations, evidence, and mysteries.

| Case | Title | Investigation |
|---|---|---|
| 01 | The Silent Witness | A mysterious death inside a locked luxury hotel room. |
| 02 | Blood on the Platform | A journalist disappears after sending a mysterious message. |
| 03 | The Midnight Call | A famous musician is found dead after receiving an anonymous call. |
| 04 | The House of Secrets | A murder exposes hidden secrets within a wealthy family. |
| 05 | The Last Alibi | All previous cases connect to a mysterious criminal known as The Phantom. |

### 🏁 Multiple Endings

Player decisions and investigation results determine the final outcome.

- **The Truth Revealed:** Expose the real criminal and uncover the conspiracy.
- **The Wrong Verdict:** An innocent person is convicted.
- **The Perfect Crime:** The mastermind escapes justice.
- **Secret Ending:** Discover all major hidden evidence and unlock an additional revelation.

---

## 🎮 Gameplay Mechanics

The core gameplay follows a detective investigation cycle:

1. Receive a new criminal case.
2. Visit the crime scene.
3. Search for hidden clues.
4. Collect and analyze evidence.
5. Interview witnesses.
6. Interrogate suspects.
7. Connect evidence using the investigation board.
8. Reconstruct the crime timeline.
9. Make logical deductions.
10. Accuse the suspect and reveal the case outcome.

The game rewards careful observation, logical reasoning, and thorough investigation rather than random guessing.

---

## 🛠️ Technology Stack

The project is designed around modern web technologies.

| Technology | Purpose |
|---|---|
| React | User interface development |
| JavaScript / TypeScript | Game logic and interactions |
| HTML5 | Application structure |
| CSS3 / Tailwind CSS | Styling and responsive design |
| Three.js / React Three Fiber | 3D environments, where implemented |
| LocalStorage / IndexedDB | Local game progress and save data |

*The exact technologies may vary depending on the implemented version of the project.*

---

## 🚀 Getting Started

Follow these instructions to run the project locally.

### Prerequisites

Make sure you have installed:

- Node.js (LTS version recommended)
- npm (Node Package Manager)
- Git
- A modern web browser

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/YOUR-USERNAME/the-last-alibi.git
```

**2. Navigate to the project directory**

```bash
cd the-last-alibi
```

**3. Install dependencies**

```bash
npm install
```

**4. Start the development server**

```bash
npm run dev
```

**5. Open the application**

Visit the local URL displayed in your terminal, typically:

```text
http://localhost:5173
```

---

## 🕹️ Controls

The controls depend on the implemented gameplay interface.

| Control | Action |
|---|---|
| Mouse | Interact with objects and menus |
| Left Click | Select evidence and dialogue options |
| WASD / Arrow Keys | Character movement, if supported |
| E | Interact with objects, if supported |
| ESC | Open pause menu |

---

## 📂 Project Structure

A suggested project structure:

```text
the-last-alibi/
│
├── public/
│   ├── assets/
│   │   ├── images/
│   │   ├── audio/
│   │   └── models/
│   │
├── src/
│   ├── components/
│   │   ├── MainMenu/
│   │   ├── CrimeScene/
│   │   ├── EvidenceBoard/
│   │   ├── Interrogation/
│   │   ├── CaseFiles/
│   │   └── GameHUD/
│   │
│   ├── data/
│   │   ├── cases/
│   │   ├── suspects/
│   │   ├── evidence/
│   │   └── dialogues/
│   │
│   ├── game/
│   │   ├── engine/
│   │   ├── investigation/
│   │   ├── progression/
│   │   └── saveSystem/
│   │
│   ├── pages/
│   ├── hooks/
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
│
├── package.json
├── index.html
└── README.md
```

*This is an illustrative structure; adjust it to match the actual repository.*

---

## 🎯 Game Objectives

The ultimate objective is to:

- Solve all five major criminal investigations.
- Discover hidden evidence.
- Identify contradictions in suspect statements.
- Uncover the connections between the victims.
- Expose the identity of The Phantom.
- Discover the truth behind Ravenwood's darkest secrets.

---

## 🌟 What Makes The Last Alibi Different?

Unlike traditional mystery games that simply ask players to select the correct answer, **The Last Alibi** emphasizes active investigation.

Players must:
- Think critically.
- Examine evidence carefully.
- Challenge suspicious statements.
- Reconstruct events.
- Identify logical inconsistencies.
- Make decisions with consequences.

The objective is not simply to find the criminal. It is to understand **how, why, and when the crime happened.**

---

## 🔮 Future Enhancements

Potential improvements and future development plans include:

- More investigation cases and story chapters.
- Expanded 3D crime scene exploration.
- Voice acting and cinematic cutscenes.
- More complex interrogation mechanics.
- Advanced suspect behavior simulation.
- Additional detective skills.
- More branching narratives.
- Cloud-based save synchronization.
- Additional languages.
- New mysteries and secret investigations.

---

## 🤝 Contributing

Contributions, suggestions, and improvements are welcome!

To contribute:

1. Fork the repository.
2. Create a new feature branch.
3. Make your changes.
4. Commit your updates.
5. Submit a pull request.

---

## 📜 License

This project is developed for educational and creative purposes.

Choose and add an appropriate open-source license before distributing the project.

---

## 👨‍💻 Developer

**Project Name:** The Last Alibi  
**Genre:** Detective Mystery / Crime Thriller / Investigation  
**Platform:** Web Browser  
**Project Type:** Interactive Story-Driven Game
**Live Application:** [(https://the-last-alibi.ai.studio/)]

## 📖 Acknowledgements

- [Google AI Studio](https://aistudio.google.com/apps) – AI-powered development platform used during project development.
- The open-source developer community for the tools and libraries used in this project.

---

## 👩‍💻 Author

**Oishee Biswas**

GitHub: [@selenophile-67](https://github.com/selenophile-67)

---

⭐ If you find this project interesting, consider giving the repository a star!

**Made with ❤️ and a passion for building cinematic web experiences.**

---

### 🕵️ FINAL MESSAGE

**In Ravenwood, everyone has a story. Everyone has a motive. Everyone has an alibi.**

But only one person knows the truth.

**Can you uncover it before it's too late?**

*Welcome to The Last Alibi.*
