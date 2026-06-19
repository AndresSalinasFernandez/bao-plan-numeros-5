"use client";

import Image from "next/image";
import type { CSSProperties } from "react";
import { useEffect, useMemo, useState } from "react";

type Stage = "ask" | "time" | "hunger" | "catch" | "hunt" | "fortune" | "done";
type MemoryPhase = "preview" | "playing" | "failed" | "won";
type MemoryCardKind = "bao" | "decoy";
type CatchPhase = "ready" | "playing" | "won" | "lost";
type MemoryCard = {
  id: string;
  kind: MemoryCardKind;
  label: string;
  art: string;
};
type CatchItem = {
  id: string;
  kind: "target" | "trap";
  label: string;
  art: string;
  startX: number;
  endX: number;
  startY: number;
  endY: number;
  xDuration: number;
  yDuration: number;
  xDelay: number;
  yDelay: number;
  zIndex: number;
};

const planDate = "20 de junio de 2026";
const noButtonMoveIntervalMs = 460;
const times = ["12:00", "12:30", "13:00", "13:30"];
const targetCatchCount = 5;
const progressLabels = ["Si", "Hora", "Hambre", "Arcade", "4 baos", "Fortuna"];
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
  { id: "gyoza", kind: "decoy", label: "Gyozas", art: "gyoza" },
];

function getProgressIndex(stage: Stage) {
  return {
    ask: 0,
    time: 1,
    hunger: 2,
    catch: 3,
    hunt: 4,
    fortune: 5,
    done: 5,
  }[stage];
}

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

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function createCatchItems(): CatchItem[] {
  const targets = [
    { label: "Bao rojo", art: "bao-red" },
    { label: "Bao dorado", art: "bao-gold" },
    { label: "Bao jade", art: "bao-jade" },
    { label: "Bao clasico", art: "bao-classic" },
    { label: "Bao extra", art: "bao-gold" },
  ].map((item, index) => ({
    ...item,
    id: `catch-bao-${index + 1}`,
    kind: "target" as const,
  }));
  const traps = [
    { label: "Te verde", art: "tea" },
    { label: "Fideos", art: "noodles" },
    { label: "Salsa", art: "chili" },
    { label: "Palillos", art: "chopsticks" },
    { label: "Arroz", art: "rice" },
  ].map((item, index) => ({
    ...item,
    id: `trap-${index + 1}`,
    kind: "trap" as const,
  }));

  const mixed = [...targets, ...traps];
  for (let index = mixed.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [mixed[index], mixed[randomIndex]] = [mixed[randomIndex], mixed[index]];
  }

  return mixed.map((item) => {
    const startsLeft = Math.random() < 0.5;
    const startsTop = Math.random() < 0.5;

    return {
      ...item,
      startX: randomBetween(startsLeft ? 8 : 82, startsLeft ? 18 : 92),
      endX: randomBetween(startsLeft ? 82 : 8, startsLeft ? 92 : 18),
      startY: randomBetween(startsTop ? 8 : 78, startsTop ? 18 : 88),
      endY: randomBetween(startsTop ? 78 : 8, startsTop ? 88 : 18),
      xDuration: randomBetween(3.8, 7.2),
      yDuration: randomBetween(4.2, 8.2),
      xDelay: -randomBetween(0, 6),
      yDelay: -randomBetween(0, 6),
      zIndex: Math.floor(randomBetween(2, 8)),
    };
  });
}

export default function Home() {
  const [stage, setStage] = useState<Stage>("ask");
  const [noPosition, setNoPosition] = useState({ left: 67, top: 58 });
  const [noAttempts, setNoAttempts] = useState(0);
  const [selectedTime, setSelectedTime] = useState(times[1]);
  const [hungerLevel, setHungerLevel] = useState(7);
  const [catchItems, setCatchItems] = useState<CatchItem[]>(() => createCatchItems());
  const [catchPhase, setCatchPhase] = useState<CatchPhase>("ready");
  const [caughtFives, setCaughtFives] = useState<string[]>([]);
  const [trapPenalty, setTrapPenalty] = useState(0);
  const [catchMessage, setCatchMessage] = useState("Atrapa los 5 baos antes de que se enfrien.");
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
  const hungerVerdict =
    hungerLevel <= 2
      ? "Diagnóstico: hambre decorativa. Aun así, el protocolo recomienda abrir hueco para baos."
      : hungerLevel <= 4
        ? "Diagnóstico: hambre discreta. Con un par de baos entra en fase prometedora."
        : hungerLevel <= 7
          ? "Diagnóstico: hambre seria. Recomendación oficial: pedir baos sin ponerse solemnes."
          : hungerLevel <= 9
            ? "Diagnóstico: hambre de misión. Conviene pedir baos y no mirar atrás."
            : "Diagnóstico: hambre legendaria. Se activa el plan refuerzos: baos, algo más y cero dudas.";
  const memoryStatus = {
    preview: "Memoriza las tarjetas: en 2 segundos se voltean.",
    playing: "Ahora encuentra los 4 baos. Si fallas, vuelta a empezar.",
    failed: "Ups: eso no era un bao. Reiniciando la ronda...",
    won: "Perfecto: 4 baos localizados sin fallar.",
  }[memoryPhase];

  const planText = useMemo(
    () =>
      `Plan aceptado: numeros 5 contigo el ${planDate} a las ${selectedTime}. Pruebas superadas: boton No esquivado, hambre ${hungerLevel}/10 con recomendacion de mas baos, ${caughtFives.length}/5 baos capturados, ${foundBaos}/4 baos encontrados sin fallar y fortuna: "${currentFortune}"`,
    [caughtFives.length, currentFortune, foundBaos, hungerLevel, selectedTime],
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

  function resetCatchGame() {
    setCatchItems(createCatchItems());
    setCatchPhase("ready");
    setCaughtFives([]);
    setTrapPenalty(0);
    setCatchMessage("Atrapa los 5 baos antes de que se enfrien.");
  }

  function startCatchGame() {
    setCatchItems(createCatchItems());
    setCatchPhase("playing");
    setCaughtFives([]);
    setTrapPenalty(0);
    setCatchMessage("Toca los baos. Evita los distractores disfrazados de comida.");
  }

  function handleCatchItem(item: CatchItem) {
    if (catchPhase !== "playing" || caughtFives.includes(item.id)) {
      return;
    }

    if (item.kind === "trap") {
      setTrapPenalty((current) => current + 1);
      setCatchMessage(`Eso era "${item.label}". No pasa nada: el plan no tiene limite de tiempo.`);
      return;
    }

    setCaughtFives((current) => {
      const next = [...current, item.id];

      if (next.length >= targetCatchCount) {
        setCatchPhase("won");
        setCatchMessage("Has demostrado reflejos, hambre y compromiso bao. Procede la cita.");
        window.setTimeout(() => {
          startMemoryRound();
          setStage("hunt");
        }, 900);
      } else {
        setCatchMessage(`Bien. Quedan ${targetCatchCount - next.length} baos por capturar.`);
      }

      return next;
    });
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
    }, 2000);

    return () => window.clearTimeout(timer);
  }, [memoryPhase, memoryRound, stage]);

  useEffect(() => {
    if (stage === "ask") {
      return;
    }

    const sectionId = {
      time: "step-time",
      hunger: "step-hunger",
      catch: "step-catch",
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
              {progressLabels.map((item, index) => {
                return (
                  <span className={index <= getProgressIndex(stage) ? "is-active" : ""} key={item}>
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
            onClick={() => setStage("hunger")}
          >
            Continuar a la calculadora de hambre
          </button>
        </section>
      )}

      {stage === "hunger" && (
        <section className="step-panel hunger-panel" id="step-hunger">
          <div className="step-heading">
            <p className="eyebrow">Mini juego</p>
            <h2>Calculadora de hambre</h2>
          </div>

          <label className="hunger-meter">
            <span>Nivel declarado de hambre</span>
            <strong>{hungerLevel}/10</strong>
            <input
              aria-label="Nivel de hambre"
              max="10"
              min="0"
              type="range"
              value={hungerLevel}
              onChange={(event) => setHungerLevel(Number(event.target.value))}
            />
          </label>

          <div className="hunger-verdict" aria-live="polite">
            {hungerVerdict}
          </div>

          <button
            className="primary-action"
            type="button"
            onClick={() => {
              resetCatchGame();
              setStage("catch");
            }}
          >
            Aceptar diagnóstico y cazar baos
          </button>
        </section>
      )}

      {stage === "catch" && (
        <section className="step-panel catch-panel" id="step-catch">
          <div className="step-heading">
            <p className="eyebrow">Mini juego</p>
            <h2>Atrapa los 5 baos</h2>
          </div>

          <div className="catch-scoreboard" aria-live="polite">
            <div>
              <strong>{caughtFives.length}</strong>
              <span>/ {targetCatchCount}</span>
            </div>
            <div>
              <strong>∞</strong>
              <span>sin limite</span>
            </div>
            <div>
              <strong>{trapPenalty}</strong>
              <span>trampas</span>
            </div>
          </div>

          <p className="catch-message">{catchMessage}</p>

          <div
            className={catchPhase === "playing" ? "catch-arena is-live" : "catch-arena"}
            aria-label="Juego de atrapar baos"
          >
            {catchItems.map((item) => {
              const isCaught = caughtFives.includes(item.id);
              const itemStyle = {
                "--start-x": `${item.startX}%`,
                "--end-x": `${item.endX}%`,
                "--start-y": `${item.startY}%`,
                "--end-y": `${item.endY}%`,
                "--x-duration": `${item.xDuration}s`,
                "--y-duration": `${item.yDuration}s`,
                "--x-delay": `${item.xDelay}s`,
                "--y-delay": `${item.yDelay}s`,
                zIndex: item.zIndex,
              } as CSSProperties;

              return (
                <button
                  aria-label={item.kind === "target" ? item.label : `Trampa ${item.label}`}
                  className={[
                    "falling-item",
                    item.kind === "target" ? "is-target" : "is-trap",
                    isCaught ? "is-caught" : "",
                  ].join(" ")}
                  disabled={catchPhase !== "playing" || isCaught}
                  key={item.id}
                  style={itemStyle}
                  type="button"
                  onClick={() => handleCatchItem(item)}
                >
                  <span className={`falling-art food-art ${item.art}`} aria-hidden="true" />
                </button>
              );
            })}
          </div>

          {catchPhase !== "playing" && catchPhase !== "won" && (
            <button className="primary-action" type="button" onClick={startCatchGame}>
              {catchPhase === "lost" ? "Reintentar captura" : "Empezar captura"}
            </button>
          )}
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
              <dd>Hambre {hungerLevel}/10, científicamente compatible con pedir más baos</dd>
            </div>
            <div>
              <dt>Reflejos</dt>
              <dd>{caughtFives.length}/5 baos capturados</dd>
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
