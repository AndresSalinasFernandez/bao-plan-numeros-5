"use client";

import { useEffect, useMemo, useState } from "react";

type Stage = "ask" | "time" | "hunt" | "fortune" | "done";

const times = ["13:30", "14:00", "14:30", "20:30", "21:00"];
const fortunes = [
  "La salsa picante aprueba esta decision.",
  "Hoy dos baos saben mejor que uno.",
  "El numero 5 lleva escrito vuestro destino.",
  "Una cita improvisada cuenta doble.",
];

const baoTiles = [
  "bao",
  "soy",
  "bao",
  "tea",
  "bao",
  "rice",
  "bao",
  "chopsticks",
  "bao",
  "chili",
  "steam",
  "bao",
];

export default function Home() {
  const [stage, setStage] = useState<Stage>("ask");
  const [noPosition, setNoPosition] = useState({ left: 67, top: 58 });
  const [noAttempts, setNoAttempts] = useState(0);
  const [selectedTime, setSelectedTime] = useState(times[1]);
  const [foundTiles, setFoundTiles] = useState<number[]>([]);
  const [fortuneIndex, setFortuneIndex] = useState(0);
  const [shareLabel, setShareLabel] = useState("Compartir plan");

  const foundBaos = foundTiles.length;
  const currentFortune = fortunes[fortuneIndex];

  const planText = useMemo(
    () =>
      `Plan aceptado: numeros 5 contigo a las ${selectedTime}. Pruebas superadas: boton No esquivado, ${foundBaos}/5 baos encontrados y fortuna: "${currentFortune}"`,
    [currentFortune, foundBaos, selectedTime],
  );

  function moveNo() {
    setNoAttempts((attempts) => attempts + 1);
    setNoPosition({
      left: 8 + Math.round(Math.random() * 70),
      top: 48 + Math.round(Math.random() * 34),
    });
  }

  function acceptPlan() {
    setStage("time");
  }

  function toggleBao(index: number) {
    if (baoTiles[index] !== "bao" || foundTiles.includes(index)) {
      return;
    }

    setFoundTiles((current) => {
      const next = [...current, index];
      if (next.length >= 5) {
        window.setTimeout(() => setStage("fortune"), 450);
      }
      return next;
    });
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
      setNoPosition({
        left: 8 + Math.round(Math.random() * 70),
        top: 48 + Math.round(Math.random() * 34),
      });
    }, 1100);

    return () => window.clearInterval(timer);
  }, [stage]);

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
            Prometo compañía excelente, debate serio sobre salsas y cero juicio
            si repetimos.
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
                onClick={moveNo}
                onMouseEnter={moveNo}
                onFocus={moveNo}
                onTouchStart={moveNo}
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
              {["Si", "Hora", "5 baos", "Fortuna"].map((item, index) => {
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
            <h2>Elige la hora del desembarco</h2>
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

          <button className="primary-action" type="button" onClick={() => setStage("hunt")}>
            Continuar al entrenamiento bao
          </button>
        </section>
      )}

      {stage === "hunt" && (
        <section className="step-panel" id="step-hunt">
          <div className="step-heading">
            <p className="eyebrow">Mini juego</p>
            <h2>Encuentra 5 baos antes de salir</h2>
          </div>

          <div className="bao-counter">
            <span>{foundBaos}</span>
            <span>/ 5 baos localizados</span>
          </div>

          <div className="bao-grid" aria-label="Juego de encontrar baos">
            {baoTiles.map((tile, index) => {
              const found = foundTiles.includes(index);
              const isBao = tile === "bao";

              return (
                <button
                  aria-label={isBao ? "Bao" : "Distraccion"}
                  className={[
                    "bao-tile",
                    isBao ? "is-bao" : "is-decoy",
                    found ? "is-found" : "",
                  ].join(" ")}
                  key={`${tile}-${index}`}
                  type="button"
                  onClick={() => toggleBao(index)}
                >
                  <span aria-hidden="true">
                    {isBao ? "bao" : tile === "soy" ? "soja" : tile === "tea" ? "te" : tile}
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {stage === "fortune" && (
        <section className="step-panel fortune-panel" id="step-fortune">
          <div className="step-heading">
            <p className="eyebrow">Mini juego</p>
            <h2>Consulta la galleta de la suerte</h2>
          </div>

          <div className="fortune-cookie" aria-live="polite">
            <span>“{currentFortune}”</span>
          </div>

          <div className="fortune-actions">
            <button
              className="secondary-action"
              type="button"
              onClick={() => setFortuneIndex((fortuneIndex + 1) % fortunes.length)}
            >
              Otra fortuna
            </button>
            <button className="primary-action" type="button" onClick={() => setStage("done")}>
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
    </main>
  );
}
