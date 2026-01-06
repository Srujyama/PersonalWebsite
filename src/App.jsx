// App.jsx
import "./style.css";
import { useEffect, useMemo, useRef, useState } from "react";

function useClock(ms = 40) {
    const [t, setT] = useState(0);

    useEffect(() => {
        const id = setInterval(() => setT((v) => v + 1), ms);
        return () => clearInterval(id);
    }, [ms]);

    return t;
}

function Pattern({ paused }) {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 grid-warp"
            style={{
                animationPlayState: paused ? 'paused' : 'running'
            }}
        />
    );
}


function Noise() {
    return (
        <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 opacity-[0.045] mix-blend-multiply"
            style={{
                backgroundImage:
                    "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='260' height='260'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='260' height='260' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E\")",
            }}
        />
    );
}

function Section({ title, hint, children, open, onToggle }) {
    return (
        <div className="border-l-2 border-black/30 pl-4">
            <button
                type="button"
                onClick={onToggle}
                className="w-full py-3 flex items-center justify-between gap-4 text-left"
            >
                <div className="flex-1">
                    <div className="text-sm font-bold text-black">{title}</div>
                </div>
                <div className="text-sm text-black/60 font-mono">{open ? "−" : "+"}</div>
            </button>

            <div
                className={`grid transition-all duration-200 ${
                    open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                }`}
            >
                <div className="overflow-hidden">{children}</div>
            </div>
        </div>
    );
}

function Modal({ open, title, onClose, children }) {
    const closeBtnRef = useRef(null);

    useEffect(() => {
        if (!open) return;

        const prevOverflow = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        closeBtnRef.current?.focus();

        const onKey = (e) => {
            if (e.key === "Escape") onClose();
        };
        window.addEventListener("keydown", onKey);

        return () => {
            document.body.style.overflow = prevOverflow;
            window.removeEventListener("keydown", onKey);
        };
    }, [open, onClose]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/25 backdrop-blur-[3px]" onClick={onClose} />
            <div className="absolute inset-x-0 top-0 bottom-0 overflow-auto">
                <div className="mx-auto w-[min(1000px,94vw)] py-8">
                    <div className="flex items-start justify-between gap-6">
                        <div>
                            <div className="text-sm font-semibold text-black">{title}</div>
                            <div className="text-xs text-black/55 mt-1">All my work</div>
                        </div>
                        <button
                            ref={closeBtnRef}
                            type="button"
                            onClick={onClose}
                            className="text-xs text-blue-600 hover:text-blue-800 underline underline-offset-4"
                        >
                            Close
                        </button>
                    </div>

                    <div className="mt-4 border-t border-black/10 pt-5">{children}</div>
                </div>
            </div>
        </div>
    );
}

export default function App() {
    const profile = useMemo(
        () => ({
            name: "Srujan Yamali",
            title: "Software Engineer, AI/ML",
            location: "Bay Area • Philadelphia • NYC",
            oneLiner: "",
            phone: "(302) 509-8614",
            email: "srujanyamali@berkeley.edu",
            site: "srujanyamali.com",
            github: "github.com/srujyama",
            linkedin: "linkedin.com/in/srujanyamali",
        }),
        []
    );

    const socialLinks = [
        { img: 'https://cdn-icons-png.flaticon.com/512/174/174857.png', alt: 'LinkedIn', href: 'https://linkedin.com/in/srujanyamali' },
        { img: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',   alt: 'GitHub',   href: 'https://github.com/srujyama' },
        { img: 'https://cdn-icons-png.flaticon.com/512/561/561127.png', alt: 'Email',    href: 'mailto:srujanyamali@berkeley.edu' },
    ];

    const experience = useMemo(
        () => [
            {
                org: "Mercor — Software Engineer",
                where: "San Francisco, CA",
                dates: "Aug 2025 – Present",
                bullets: [
                    "Engineered enterprise-scale AI/ML developer tooling powering model evaluation, safety benchmarking, and data labeling workflows across top AI labs production environments; Developed LLM API pipeline for mass testing on human data.",
                    "Automated multimodal data ingestion, fine-tuning, and continuous deployment pipelines using Prefect, MLflow, and distributed Kubernetes clusters—reducing enterprise experiment-to-production cycle time by 40%.",
                ],
            },
            {
                org: "Visa — Software Engineer Intern",
                where: "Remote",
                dates: "Nov 2025 – Present",
                bullets: [
                    "Developed internal LLM-powered enterprise automation tools supporting Visa's risk and product teams.",
                    "Designed an AI-generated Statement of Work pipeline helping automate 10,000 client implementation projects annually.",
                    "Built scalable cloud infrastructure and data ingestion pipelines to support real-time sensor streaming and model execution.",
                ],
            },
            {
                org: "Pear VC — Machine Learning Intern",
                where: "Remote",
                dates: "Aug 2024 – Nov 2024",
                bullets: [
                    "Designed and deployed enterprise-grade LLM systems for automated investment deal flow analysis and due diligence across 1000+ startups",
                    "Implemented multi-agent RAG architectures handling structured analysis of hundreds of pitch decks and investor reports monthly",
                    "Automated portfolio monitoring pipelines processing 24/7 market data, LinkedIn signals, and press releases using LangChain and OpenAI API for portfolio companies",
                ],
            },
        ],
        []
    );

    const projects = useMemo(
        () => [
            {
                name: "LLM Risk Management Compliance System",
                stack: "Python, Anthropic Claude API, RAG, Vector Databases",
                bullets: [
                    "Architected enterprise-scale LLM compliance platform for EU AI Act and SEC regulatory requirements, processing 1000+ pages of legal documentation",
                    "Implemented real-time risk scoring engine monitoring model outputs across 50+ compliance dimensions with automated flagging and remediation workflows",
                ],
            },
            {
                name: "Enterprise Multi-Agent Platform with MCP Integration",
                stack: "Python, LangGraph, Model Context Protocol, AWS Bedrock",
                bullets: [
                    "Developed production-ready multi-agent orchestration system enabling autonomous enterprise workflows with 85% automation coverage",
                    "Integrated MCP servers for Slack, Gmail, and Linear enabling secure, controlled tool use across corporate infrastructure",
                ],
            },
            {
                name: "Smart Contract Autonomous Investor",
                stack: "Solidity, Python, Anthropic API, Ethers.js",
                bullets: [
                    "Built AI-powered investor agent deploying capital based on real-time blockchain analysis and automated due diligence",
                    "Implemented smart contract trading system with dynamic risk management achieving 200+ successful autonomous trades",
                ],
            },
            {
                name: "Distributed Computing Framework for ML Training",
                stack: "Python, PyTorch, Ray, Kubernetes",
                bullets: [
                    "Architected scalable distributed training infrastructure supporting 100+ concurrent model experiments",
                    "Reduced training time by 60% through intelligent workload distribution and resource optimization",
                ],
            },
        ],
        []
    );

    const publications = useMemo(
        () => [
            {
                citation:
                    "Yamali, S., Chen, J., & Rodriguez, M. (2024). 'Efficient Multi-Agent Coordination in High-Dimensional Decision Spaces.' Conference on Neural Information Processing Systems (NeurIPS), Workshop on Foundation Models.",
            },
            {
                citation:
                    "Yamali, S., & Kumar, A. (2024). 'Scalable Reinforcement Learning for Enterprise Automation.' International Conference on Machine Learning (ICML), AutoML Workshop.",
            },
        ],
        []
    );

    const skills = useMemo(
        () => [
            "Languages: Python, JavaScript/TypeScript, C/C++, Java, SQL, Solidity, R, RISC-V Assembly",
            "AI/ML: PyTorch, TensorFlow, Scikit-learn, LangChain, Transformers, RAG Architectures, Vector Databases (Pinecone, Weaviate), Fine-tuning (LoRA, QLoRA), Prompt Engineering, Multi-Agent Systems, Model Context Protocol (MCP)",
            "Cloud & Infrastructure: AWS (Bedrock, Lambda, EC2, S3), GCP, Azure, Docker, Kubernetes, Terraform",
            "MLOps: MLflow, Weights & Biases, Prefect, Apache Airflow, Model Monitoring, A/B Testing",
            "Backend & Data: FastAPI, Node.js, PostgreSQL, MongoDB, Redis, Apache Kafka, GraphQL",
            "Tools & Platforms: Git, Linux, Jupyter, VS Code, Postman, Swagger, CI/CD (GitHub Actions, Jenkins)",
        ],
        []
    );

    const [modal, setModal] = useState("");
    const [openKey, setOpenKey] = useState(""); 
    const [animationPaused, setAnimationPaused] = useState(false);

    const closeModal = () => setModal("");

    return (
        <div className="relative min-h-screen overflow-x-hidden">
            <Pattern paused={animationPaused} />
            <Noise />

            {/* Social links - Desktop: right side, Mobile: bottom */}
            <div 
                className="social-links-container"
            >
                {socialLinks.map((link, idx) => (
                    <a
                        key={idx}
                        href={link.href}
                        target={link.target || (link.href.startsWith('mailto') ? undefined : '_blank')}
                        rel={link.href.startsWith('mailto') ? undefined : 'noopener noreferrer'}
                        download={link.download || undefined}
                        className="hover:scale-110 transition-transform block"
                        aria-label={link.alt}
                        style={{
                            display: 'block',
                            width: '40px',
                            height: '40px',
                        }}
                    >
                        <img 
                            src={link.img} 
                            alt={link.alt}
                            style={{
                                width: '40px',
                                height: '40px',
                                objectFit: 'contain',
                                filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                                display: 'block',
                            }}
                        />
                    </a>
                ))}
            </div>

            {/* Animation Control - Desktop: below social links, Mobile: bottom */}
            <div 
                className="pause-button-container"
            >
                <button
                    onClick={() => setAnimationPaused(!animationPaused)}
                    className="hover:scale-110 transition-transform"
                    aria-label={animationPaused ? "Resume Animation" : "Pause Animation"}
                    style={{
                        display: 'block',
                        width: '40px',
                        height: '40px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: 0,
                    }}
                >
                    <img 
                        src={animationPaused 
                            ? 'https://cdn-icons-png.flaticon.com/512/727/727245.png' 
                            : 'https://cdn-icons-png.flaticon.com/512/2404/2404385.png'}
                        alt={animationPaused ? "Resume" : "Pause"}
                        style={{
                            width: '40px',
                            height: '40px',
                            objectFit: 'contain',
                            filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
                            display: 'block',
                        }}
                    />
                </button>
            </div>

            <main className="relative z-10 mx-auto max-w-[900px] px-8 py-16 mobile-content">
                <section className="p-10">
                    {/* Header section - Enhanced and modern */}
                    <div className="pb-12 border-b-2 border-black/20">
                        <h1 className="text-7xl font-black text-black tracking-tight mb-6 leading-tight" style={{textShadow: '0 0 30px rgba(255,255,255,0.9)'}}>
                            {profile.name}
                        </h1>
                        <div className="space-y-3">
                            <div className="text-2xl text-black font-bold" style={{textShadow: '0 0 20px rgba(255,255,255,0.8)'}}>
                                {profile.title}
                            </div>
                            <div className="text-xl text-black/90 font-medium" style={{textShadow: '0 0 20px rgba(255,255,255,0.8)'}}>
                                 {profile.location}
                            </div>
                            <div className="text-lg text-black/90 mt-6 leading-relaxed max-w-2xl font-medium" style={{textShadow: '0 0 20px rgba(255,255,255,0.8)'}}>
                                {profile.oneLiner}
                            </div>
                        </div>
                    </div>

                    {/* Body: larger text and more defined sections */}
                    <div className="pt-10 grid gap-6">
                        {/* Education - Always visible at top, only coursework expands */}
                        <div className="border-l-4 border-black/40 pl-6 py-2">
                            <div className="py-2">
                                <div className="flex flex-wrap items-baseline justify-between gap-3">
                                    <div className="text-xl font-bold" style={{color: '#FDB515'}}>University of California, Berkeley</div>
                                    <div className="text-sm text-black/80 font-semibold" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>May 2027</div>
                                </div>
                                <div className="mt-2 text-lg font-semibold" style={{color: '#003262'}}>B.S. in Computer Science</div>
                            </div>
                            
                            <button
                                type="button"
                                onClick={() => setOpenKey(openKey === "education" ? "" : "education")}
                                className="w-full py-1 flex items-center justify-between gap-4 text-left"
                            >
                                <div className="text-sm font-bold text-black" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>Coursework</div>
                                <div className="text-lg text-black/60 font-mono">{openKey === "education" ? "−" : "+"}</div>
                            </button>
                            
                            <div
                                className={`grid transition-all duration-200 ${
                                    openKey === "education" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-1 pb-2 text-sm text-black/90 leading-relaxed" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                                        Machine Learning, Computer Architecture, Data Structures, Algorithms, Discrete Mathematics & Probability Theory, Signals & Systems, Circuits & Devices, Linear Algebra, Artificial Intelligence, Efficient Algorithms
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Experience - Header + expandable content */}
                        <div className="border-l-4 border-black/40 pl-5 py-1">
                            <button
                                type="button"
                                onClick={() => setOpenKey(openKey === "experience" ? "" : "experience")}
                                className="w-full py-4 flex items-center justify-between gap-4 text-left"
                            >
                                <div className="text-xl font-bold text-black" style={{textShadow: '0 0 20px rgba(255,255,255,0.9)'}}>Experience</div>
                                <div className="text-lg text-black/60 font-mono">{openKey === "experience" ? "−" : "+"}</div>
                            </button>
                            
                            <div
                                className={`grid transition-all duration-200 ${
                                    openKey === "experience" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-3 pb-4 space-y-6">
                                        {experience.map((e, idx) => {
                                            // Split org into company and role
                                            const parts = e.org.split(' — ');
                                            const company = parts[0];
                                            const role = parts[1] || '';
                                            
                                            return (
                                                <div key={idx} className="pb-6 border-b-2 border-black/10 last:border-b-0">
                                                    <div className="flex flex-wrap items-baseline justify-between gap-3">
                                                        <div className="text-lg font-bold text-black" style={{textShadow: '0 0 20px rgba(255,255,255,0.9)'}}>{company}</div>
                                                        <div className="text-sm text-black/80 font-semibold" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                                                            {e.where}
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-wrap items-baseline justify-between gap-3 mt-1">
                                                        <div className="text-base text-black/90 font-semibold" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>{role}</div>
                                                        <div className="text-sm text-black/70 font-medium" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                                                            {e.dates}
                                                        </div>
                                                    </div>
                                                    <ul className="mt-3 text-base text-black list-disc pl-6 space-y-2 leading-relaxed" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                                                        {e.bullets.map((b, i) => (
                                                            <li key={i}>{b}</li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            );
                                        })}
                                        
                                        {/* Resume Buttons at the bottom of experience */}
                                        <div className="pt-4 flex gap-3">
                                            <a
                                                href="/public/SrujanYamaliResumeJan2026.pdf"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="flex-1 px-4 py-3 text-black font-semibold rounded-lg transition-all"
                                                style={{
                                                    border: '3px solid black',
                                                    backgroundColor: 'transparent',
                                                    textAlign: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                View Resume
                                            </a>
                                            <a
                                                href="/public/SrujanYamaliResumeJan2026.pdf"
                                                download
                                                className="flex-1 px-4 py-3 text-black font-semibold rounded-lg transition-all"
                                                style={{
                                                    border: '3px solid black',
                                                    backgroundColor: 'transparent',
                                                    textAlign: 'center',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(0,0,0,0.05)'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                                            >
                                                Download Resume
                                            </a>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Projects - Header + expandable content */}
                        <div className="border-l-4 border-black/40 pl-6 py-2">
                            <button
                                type="button"
                                onClick={() => setOpenKey(openKey === "projects" ? "" : "projects")}
                                className="w-full py-4 flex items-center justify-between gap-4 text-left"
                            >
                                <div className="text-xl font-bold text-black" style={{textShadow: '0 0 20px rgba(255,255,255,0.9)'}}>Projects</div>
                                <div className="text-lg text-black/60 font-mono">{openKey === "projects" ? "−" : "+"}</div>
                            </button>
                            
                            <div
                                className={`grid transition-all duration-200 ${
                                    openKey === "projects" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-3 pb-4 space-y-6">
                                        {projects.map((p, idx) => (
                                            <div key={idx} className="pb-6 border-b-2 border-black/10 last:border-b-0">
                                                <div className="text-lg font-bold text-black" style={{textShadow: '0 0 20px rgba(255,255,255,0.9)'}}>{p.name}</div>
                                                <div className="text-sm text-black/70 mt-1 font-semibold" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>{p.stack}</div>
                                                <ul className="mt-3 text-base text-black list-disc pl-6 space-y-2 leading-relaxed" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                                                    {p.bullets.map((b, i) => (
                                                        <li key={i}>{b}</li>
                                                    ))}
                                                </ul>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Publications - Header + expandable content */}
                        <div className="border-l-4 border-black/40 pl-6 py-2">
                            <button
                                type="button"
                                onClick={() => setOpenKey(openKey === "pubs" ? "" : "pubs")}
                                className="w-full py-4 flex items-center justify-between gap-4 text-left"
                            >
                                <div className="text-xl font-bold text-black" style={{textShadow: '0 0 20px rgba(255,255,255,0.9)'}}>Publications & Conferences</div>
                                <div className="text-lg text-black/60 font-mono">{openKey === "pubs" ? "−" : "+"}</div>
                            </button>
                            
                            <div
                                className={`grid transition-all duration-200 ${
                                    openKey === "pubs" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <div className="pt-3 pb-4 space-y-4">
                                        {publications.map((p, i) => (
                                            <div key={i} className="pb-4 border-b-2 border-black/10 last:border-b-0 text-base text-black leading-relaxed" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                                                {p.citation}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Skills - Header + expandable content */}
                        <div className="border-l-4 border-black/40 pl-6 py-2">
                            <button
                                type="button"
                                onClick={() => setOpenKey(openKey === "skills" ? "" : "skills")}
                                className="w-full py-4 flex items-center justify-between gap-4 text-left"
                            >
                                <div className="text-xl font-bold text-black" style={{textShadow: '0 0 20px rgba(255,255,255,0.9)'}}>Skills</div>
                                <div className="text-lg text-black/60 font-mono">{openKey === "skills" ? "−" : "+"}</div>
                            </button>
                            
                            <div
                                className={`grid transition-all duration-200 ${
                                    openKey === "skills" ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                                }`}
                            >
                                <div className="overflow-hidden">
                                    <ul className="pt-3 pb-4 text-base text-black list-disc pl-6 space-y-2 leading-relaxed" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                                        {skills.map((s, i) => (
                                            <li key={i}>{s}</li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <div className="pt-8 text-sm text-black font-medium border-t-2 border-black/20" style={{textShadow: '0 0 15px rgba(255,255,255,0.8)'}}>
                            <div>
                                © {new Date().getFullYear()} {profile.name}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            {/* Modal (also no box) */}
            <Modal open={modal === "experience"} title="Experience" onClose={closeModal}>
                <div className="space-y-6">
                    {experience.map((e) => {
                        const parts = e.org.split(' — ');
                        const company = parts[0];
                        const role = parts[1] || '';
                        
                        return (
                            <div key={e.org} className="pb-6 border-b border-black/10 last:border-b-0">
                                <div className="flex flex-wrap items-baseline justify-between gap-2">
                                    <div className="text-sm font-bold text-black">{company}</div>
                                    <div className="text-xs text-black/80 font-medium">
                                        {e.where}
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-baseline justify-between gap-2 mt-1">
                                    <div className="text-sm text-black/90 font-semibold">{role}</div>
                                    <div className="text-xs text-black/70 font-medium">
                                        {e.dates}
                                    </div>
                                </div>
                                <ul className="mt-2 text-sm text-black list-disc pl-5 space-y-1.5">
                                    {e.bullets.map((b, i) => (
                                        <li key={i}>{b}</li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            </Modal>
        </div>
    );
}
