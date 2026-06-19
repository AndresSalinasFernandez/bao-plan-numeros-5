"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

type Stage = "ask" | "time" | "hunt" | "fortune" | "done";
type MemoryPhase = "preview" | "playing" | "failed" | "won";
type MemoryCardKind = "bao" | "decoy";
type MemoryCard = {
  id: string;
  kind: MemoryCardKind;
  label: string;
  art: string;
};

const planDate = "20 de junio de 2026";
const noButtonMoveIntervalMs = 460;
const times = ["12:00", "12:30", "13:00", "13:30"];
const fortunes = [
  "La salsa picante aprueba esta decisión.",
  "Hoy dos baos saben mejor que uno.",
  "El número 5 lleva escrito vuestro destino.",
  "Una cita improvisada cuenta doble.",
  "Si aparece hambre, aparece otro plato.",
  "El universo recomienda pedir para compartir.",
];
const fortuneCookies = [0, 1, 2, 3];

const memoryDeck: MemoryCard[] = [
  { id: "bao-red", kind: "bao", label: "Bao rojo", art: "bao-red" },
  { id: "tea", kind: "decoy", label: "Te verde", art: "tea" },
  { id: "bao-gold", kind: "bao", label: "Bao dorado", art: "bao-gold" },
  { id: "noodles", kind: "decoy", label: "Fideos", art: "noodles" },
  { id: "chili", kind: "decoy", label: "Salsa", art: "chili" },
  { id: "bao-jade", kind: "bao", label: "Bao jade", art: "bao-jade" },
  { id: "chopsticks", kind: "decoy", label: "Palillos", art: "chopsticks" },
  { id: "bao-classic", kind: "bao", label: "Bao clasico", art: "bao-classic" },
  { id: "soy", kind: "decoy", label: "Soja", art: "soy" },
  { id: "rice", kind: "decoy", label: "Arroz", art: "rice" },
  { id: "soup", kind: "decoy", label: "Caldo", art: "soup" },
  { id: "edamame", kind: "decoy", label: "Edamame", art: "edamame" },
];

function shuffleDeck() {
  const shuffled = [...memoryDeck];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[index]];
  }

  return shuffled;
}

function getRandomFortuneIndex() {
  return Math.floor(Math.random() * fortunes.length);
}

function getRandomNoPosition() {
  return {
    left: 5 + Math.round(Math.random() * 82),
    top: 42 + Math.round(Math.random() * 42),
  };
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("ask");
  const [noPosition, setNoPosition] = useState({ left: 67, top: 58 });
  const [noAttempts, setNoAttempts] = useState(0);
  const [selectedTime, setSelectedTime] = useState(times[1]);
  const [memoryCards, setMemoryCards] = useState<MemoryCard[]>(memoryDeck);
  const [memoryPhase, setMemoryPhase] = useState<MemoryPhase>("preview");
  const [memoryRound, setMemoryRound] = useState(1);
  const [revealedMemoryIds, setRevealedMemoryIds] = useState<string[]>([]);
  const [fortuneIndex, setFortuneIndex] = useState(0);
  const [openedCookie, setOpenedCookie] = useState<number | null>(null);
  const [showNoWarning, setShowNoWarning] = useState(false);
  const [shareLabel, setShareLabel] = useState("Compartir plan");

  const foundBaos = revealedMemoryIds.filter((id) =>
    memoryCards.some((card) => card.id === id && card.kind === "bao"),
  ).length;
  const currentFortune = fortunes[fortuneIndex];
  const memoryStatus = {
    preview: "Memoriza las tarjetas: en 3 segundos se voltean.",
    playing: "Ahora encuentra los 4 baos. Si fallas, vuelta a empezar.",
    failed: "Ups: eso no era un bao. Reiniciando la ronda...",
    won: "Perfecto: 4 baos localizados sin fallar.",
  }[memoryPhase];

  const planText = useMemo(
    () =>
      `Plan aceptado: numeros 5 contigo el ${planDate} a las ${selectedTime}. Pruebas superadas: boton No esquivado, ${foundBaos}/4 baos encontrados sin fallar y fortuna: "${currentFortune}"`,
    [currentFortune, foundBaos, selectedTime],
  );

  function triggerNoWarning() {
    if (showNoWarning) {
      return;
    }

    setNoAttempts((attempts) => attempts + 1);
    setShowNoWarning(true);
  }

  function acceptPlan() {
    setStage("time");
  }

  function startMemoryRound() {
    setMemoryCards(shuffleDeck());
    setRevealedMemoryIds([]);
    setMemoryPhase("preview");
    setMemoryRound((round) => round + 1);
  }

  function handleMemoryCard(card: MemoryCard) {
    if (memoryPhase !== "playing" || revealedMemoryIds.includes(card.id)) {
      return;
    }

    if (card.kind !== "bao") {
      setRevealedMemoryIds((current) => [...current, card.id]);
      setMemoryPhase("failed");
      window.setTimeout(startMemoryRound, 1150);
      return;
    }

    setRevealedMemoryIds((current) => {
      const next = [...current, card.id];

      if (next.length >= 4) {
        setMemoryPhase("won");
        window.setTimeout(() => setStage("fortune"), 650);
      }

      return next;
    });
  }

  function chooseFortuneCookie(cookieIndex: number) {
    if (openedCookie !== null) {
      return;
    }

    setOpenedCookie(cookieIndex);
    setFortuneIndex(getRandomFortuneIndex());
  }

  async function sharePlan() {
    const shareData = {
      title: "Plan de numeros 5",
      text: planText,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
        setShareLabel("Plan enviado");
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(planText);
        setShareLabel("Plan copiado");
      } else {
        setShareLabel("Listo para celebrar");
      }
    } catch {
      setShareLabel("Plan guardado aqui");
    }
  }

  useEffect(() => {
    if (stage !== "ask") {
      return;
    }

    const timer = window.setInterval(() => {
      setNoPosition(getRandomNoPosition());
    }, noButtonMoveIntervalMs);

    return () => window.clearInterval(timer);
  }, [stage]);

  useEffect(() => {
    if (stage !== "hunt" || memoryPhase !== "preview") {
      return;
    }

    const timer = window.setTimeout(() => {
      setMemoryPhase("playing");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [memoryPhase, memoryRound, stage]);

  useEffect(() => {
    if (stage === "ask") {
      return;
    }

    const sectionId = {
      time: "step-time",
      hunt: "step-hunt",
      fortune: "step-fortune",
      done: "step-done",
    }[stage];

    window.setTimeout(() => {
      document.getElementById(sectionId)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 80);
  }, [stage]);

  return (
    <main className="bao-shell">
      <section className="hero" id="plan-card">
        <div className="hero__inner">
          <p className="eyebrow">Solicitud oficial de plan</p>
          <h1>¿Quieres ir a por unos números 5 conmigo?</h1>
          <p className="hero__copy">
            Prometo compañía excelente y cero reticencias a pedir más baos.
          </p>

          {stage === "ask" && (
            <div className="answer-zone" aria-live="polite">
              <button className="yes-button" type="button" onClick={acceptPlan}>
                Sí, por supuesto!
              </button>

              <button
                className="no-button"
                style={{
                  left: `${noPosition.left}%`,
                  top: `${noPosition.top}%`,
                }}
                type="button"
                onClick={triggerNoWarning}
                onPointerDown={(event) => {
                  event.preventDefault();
                  triggerNoWarning();
                }}
              >
                No
              </button>

              <p className="hint">
                {noAttempts === 0
                  ? "El boton pequeno tiene poca vocacion de permanencia."
                  : `Intentos de No anulados por el universo: ${noAttempts}`}
              </p>
            </div>
          )}

          {stage !== "ask" && (
            <div className="progress" aria-label="Progreso del plan">
              {["Si", "Hora", "4 baos", "Fortuna"].map((item, index) => {
                const isActive =
                  (stage === "time" && index <= 1) ||
                  (stage === "hunt" && index <= 2) ||
                  ((stage === "fortune" || stage === "done") && index <= 3);

                return (
                  <span className={isActive ? "is-active" : ""} key={item}>
                    {item}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {stage === "time" && (
        <section className="step-panel" id="step-time">
          <div className="step-heading">
            <p className="eyebrow">Paso 1</p>
            <h2>Elige la hora de encuentro</h2>
          </div>

          <div className="date-strip">
            Día del plan: <strong>{planDate}</strong>.
          </div>

          <div className="time-grid">
            {times.map((time) => (
              <button
                className={selectedTime === time ? "time-chip is-picked" : "time-chip"}
                key={time}
                type="button"
                onClick={() => setSelectedTime(time)}
              >
                {time}
              </button>
            ))}
          </div>

          <div className="note-strip">
            Hora elegida: <strong>{selectedTime}</strong>. Margen de llegada
            permitido: el necesario para tener hambre.
          </div>

          <button
            className="primary-action"
            type="button"
            onClick={() => {
              startMemoryRound();
              setStage("hunt");
            }}
          >
            Continuar al entrenamiento bao
          </button>
        </section>
      )}

      {stage === "hunt" && (
        <section className="step-panel" id="step-hunt">
          <div className="step-heading">
            <p className="eyebrow">Mini juego</p>
            <h2>Encuentra los 4 baos sin fallar</h2>
          </div>

          <div className="memory-head">
            <div className="bao-counter" aria-live="polite">
              <span>{foundBaos}</span>
              <span>/ 4 baos</span>
            </div>
            <p>{memoryStatus}</p>
          </div>

          <div
            className={[
              "memory-board",
              memoryPhase === "preview" ? "is-previewing" : "",
            ].join(" ")}
            aria-label="Juego de memoria de baos"
          >
            {memoryCards.map((card) => {
              const isVisible = memoryPhase === "preview" || revealedMemoryIds.includes(card.id);
              const isWrong = memoryPhase === "failed" && revealedMemoryIds.includes(card.id);

              return (
                <button
                  aria-label={isVisible ? card.label : "Tarjeta oculta"}
                  className={[
                    "memory-card",
                    isVisible ? "is-visible" : "",
                    card.kind === "bao" ? "is-bao-card" : "is-decoy-card",
                    isWrong ? "is-wrong" : "",
                  ].join(" ")}
                  disabled={memoryPhase !== "playing" || revealedMemoryIds.includes(card.id)}
                  key={card.id}
                  type="button"
                  onClick={() => handleMemoryCard(card)}
                >
                  <span className="memory-card__inner" aria-hidden="true">
                    <span className="memory-card__face memory-card__front">
                      <span className={`food-art ${card.art}`} />
                      <span>{card.label}</span>
                    </span>
                    <span className="memory-card__face memory-card__back">?</span>
                  </span>
                </button>
              );
            })}
          </div>

          <button className="secondary-action memory-reset" type="button" onClick={startMemoryRound}>
            Barajar y empezar otra vez
          </button>
        </section>
      )}

      {stage === "fortune" && (
        <section className="step-panel fortune-panel" id="step-fortune">
          <div className="step-heading">
            <p className="eyebrow">Mini juego</p>
            <h2>Consulta la galleta de la suerte</h2>
          </div>

          <div className="fortune-cookie-grid" aria-label="Galletas de la suerte cerradas">
            {fortuneCookies.map((cookieIndex) => {
              const isOpen = openedCookie === cookieIndex;

              return (
                <button
                  aria-label={isOpen ? "Galleta abierta" : `Galleta ${cookieIndex + 1} cerrada`}
                  className={isOpen ? "fortune-cookie-button is-open" : "fortune-cookie-button"}
                  disabled={openedCookie !== null && !isOpen}
                  key={cookieIndex}
                  type="button"
                  onClick={() => chooseFortuneCookie(cookieIndex)}
                >
                  <span className="fortune-cookie-shape" aria-hidden="true" />
                  <span>{isOpen ? "Abierta" : "Cerrada"}</span>
                </button>
              );
            })}
          </div>

          {openedCookie === null ? (
            <p className="fortune-hint">Elige una galleta. Solo una trae el mensaje oficial.</p>
          ) : (
            <div className="fortune-cookie" aria-live="polite">
              <span>“{currentFortune}”</span>
            </div>
          )}

          <div className="fortune-actions">
            {openedCookie !== null && (
              <button
                className="secondary-action"
                type="button"
                onClick={() => setOpenedCookie(null)}
              >
                Elegir otra galleta
              </button>
            )}
            <button
              className="primary-action"
              disabled={openedCookie === null}
              type="button"
              onClick={() => setStage("done")}
            >
              Sellar el plan
            </button>
          </div>
        </section>
      )}

      {stage === "done" && (
        <section className="receipt" id="step-done">
          <p className="eyebrow">Veredicto</p>
          <h2>Plan aprobado con honores</h2>
          <dl>
            <div>
              <dt>Destino</dt>
              <dd>Números 5</dd>
            </div>
            <div>
              <dt>Día</dt>
              <dd>{planDate}</dd>
            </div>
            <div>
              <dt>Hora</dt>
              <dd>{selectedTime}</dd>
            </div>
            <div>
              <dt>Estado emocional</dt>
              <dd>Con hambre y buena compañía</dd>
            </div>
            <div>
              <dt>Fortuna</dt>
              <dd>{currentFortune}</dd>
            </div>
          </dl>

          <div className="receipt-actions">
            <button className="primary-action" type="button" onClick={sharePlan}>
              {shareLabel}
            </button>
            <a
              className="secondary-action"
              href={`https://wa.me/?text=${encodeURIComponent(planText)}`}
              rel="noreferrer"
              target="_blank"
            >
              Mandar por WhatsApp
            </a>
          </div>
        </section>
      )}

      {showNoWarning && (
        <div className="no-warning" role="dialog" aria-modal="true" aria-labelledby="no-warning-title">
        <div className="no-warning__panel">
            <Image alt="" height={1536} priority src="/devil-warning.png" width={1024} />
            <h2 id="no-warning-title">¿Estás seguro?</h2>
            <button className="primary-action" type="button" onClick={() => setShowNoWarning(false)}>
              Mejor vamos a por baos
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
