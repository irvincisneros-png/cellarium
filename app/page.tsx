import {
  TUTORIAL,
  nextTutorialStep,
  tutorialAllows,
} from '../lib/tutorial.mjs';
import { useEffect, useRef, useState } from 'react';
import {
  Leaf,
  Sun,
  Moon,
  Droplets,
  Zap,
  Hexagon,
  Heart,
  Play,
  Pause,
  Volume2,
  Music2,
  Settings2,
  BookOpen,
  ArrowUpRight,
  ArrowRight,
  RotateCcw,
  X,
  Check,
  LockKeyhole,
  Sprout,
  Flower2,
  Cherry,
} from 'lucide-react';
import CellScene from './CellScene';
import PlantScene from './PlantScene';
import {
  LEVELS,
  PARTS,
  EVENTS,
  initialState,
  tick,
  act,
  rates,
  daylight,
  capacities,
  upgradeCost,
  canGrow,
  totalUpgrades,
  stars,
  restore,
  CELLS,
  contributors,
} from '../lib/world.mjs';
import { Sound } from '../lib/audio';
const SAVE = 'cellarium-save-v2',
  PROGRESS = 'cellarium-progress-v2',
  PREF = 'cellarium-preferences-v1';
const resourceIcons = { water: Droplets, sugar: Hexagon, energy: Zap };
const rewardIcons = [Sprout, Leaf, Flower2, Cherry];
function readProgress() {
  try {
    const p = JSON.parse(localStorage.getItem(PROGRESS) || '{}');
    return Object.fromEntries(
      Object.entries(p).filter(
        ([k, v]) =>
          /^[0-3]$/.test(k) &&
          Number.isInteger(v) &&
          Number(v) >= 1 &&
          Number(v) <= 3,
      ),
    );
  } catch {
    return {};
  }
}
function Plant({ stage = 0 }: { stage: number }) {
  return (
    <svg
      className="plant-art"
      viewBox="0 0 180 180"
      aria-label={
        ['Seedling', 'Leafy plant', 'Flowering plant', 'Fruiting plant'][stage]
      }
      role="img"
    >
      <ellipse cx="90" cy="158" rx="48" ry="9" fill="#0003" />
      <path d="M74 130h34l-6 29H80z" fill="#b78865" />
      <path d="M72 130h38v9H72z" fill="#d3a580" />
      <path
        d="M91 132Q82 85 94 45"
        stroke="#b5da83"
        strokeWidth="5"
        fill="none"
      />
      <path
        d="M87 110Q42 116 48 78Q83 77 87 110M90 91Q129 95 138 56Q99 55 90 91"
        fill="#86b779"
      />
      <path d="M89 107 58 87M95 85 127 66" stroke="#badf91" strokeWidth="2" />
      {stage > 0 && (
        <>
          <path
            d="M90 69Q57 69 58 40Q88 44 90 69M92 52Q124 56 123 26Q99 29 92 52"
            fill="#b2d78a"
          />
        </>
      )}
      {stage > 1 && (
        <g transform="translate(94 32)">
          {[0, 72, 144, 216, 288].map((a) => (
            <ellipse
              key={a}
              rx="9"
              ry="16"
              transform={`rotate(${a}) translate(0 -9)`}
              fill="#f4cdad"
            />
          ))}
          <circle r="7" fill="#e8b15e" />
        </g>
      )}
      {stage > 2 && (
        <>
          <path
            d="M96 76q15 5 20 19"
            stroke="#93c17e"
            strokeWidth="3"
            fill="none"
          />
          <circle cx="116" cy="104" r="16" fill="#ef8b6c" />
          <path d="m110 86 7 4 7-5-5 9-9-2" fill="#85b56a" />
          <ellipse
            cx="111"
            cy="100"
            rx="3"
            ry="5"
            fill="#ffd3a7"
            opacity=".7"
          />
        </>
      )}
    </svg>
  );
}
function Modal({
  children,
  onClose,
  wide = false,
}: {
  children: React.ReactNode;
  onClose?: () => void;
  wide?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const closeAction = useRef(onClose);
  useEffect(() => {
    closeAction.current = onClose;
  }, [onClose]);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement;
    const node = ref.current!;
    const first = node.querySelector<HTMLElement>('button');
    first?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeAction.current) closeAction.current();
      if (e.key === 'Tab') {
        const all = Array.from(
          node.querySelectorAll<HTMLElement>(
            'button:not(:disabled),a[href],input',
          ),
        );
        const a = all[0],
          z = all.at(-1);
        if (e.shiftKey && document.activeElement === a) {
          e.preventDefault();
          z?.focus();
        } else if (!e.shiftKey && document.activeElement === z) {
          e.preventDefault();
          a?.focus();
        }
      }
    };
    node.addEventListener('keydown', key);
    return () => {
      node.removeEventListener('keydown', key);
      prev?.focus();
    };
  }, []);
  return (
    <div className="veil">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Cellarium panel"
        className={`modal ${wide ? 'wide' : ''}`}
        ref={ref}
      >
        {onClose && (
          <button
            className="icon close"
            aria-label="Close panel"
            onClick={onClose}
          >
            <X size={19} />
          </button>
        )}
        {children}
      </div>
    </div>
  );
}
export default function Game() {
  const [s, setS] = useState(() => {
    try {
      return restore(localStorage.getItem(SAVE)) || initialState();
    } catch {
      return initialState();
    }
  });
  const [tutorial, setTutorial] = useState<number | null>(null);
  const practiceBackup = useRef<any>(null);
  const [tutorialSeen, setTutorialSeen] = useState(() => {
    try {
      return localStorage.getItem('cellarium-tutorial-v1') === 'done';
    } catch {
      return false;
    }
  });
  const [progress, setProgress] = useState<Record<string, any>>(readProgress);
  const [view, setView] = useState<'plant' | 'cell'>('plant');
  const [screen, setScreen] = useState<'menu' | 'game'>('menu');
  const [paused, setPaused] = useState(false);
  const [panel, setPanel] = useState<
    null | 'guide' | 'settings' | 'restart' | 'brief' | 'replace'
  >(null);
  const [selected, setSelected] = useState<keyof typeof PARTS>('chloroplast');
  const [pendingLevel, setPendingLevel] = useState(0);
  const [speed, setSpeed] = useState(1);
  const [resetKey, setResetKey] = useState(0);
  const [prefs, setPrefs] = useState(() => {
    try {
      return {
        ...{
          music: true,
          effects: true,
          reduced: matchMedia('(prefers-reduced-motion: reduce)').matches,
        },
        ...JSON.parse(localStorage.getItem(PREF) || '{}'),
      };
    } catch {
      return { music: true, effects: true, reduced: false };
    }
  });
  const [saveOK, setSaveOK] = useState(true);
  const [toast, setToast] = useState('');
  const audio = useRef<Sound | null>(null);
  const live = useRef(s);
  live.current = practiceBackup.current?.world || s;
  const visibleState = useRef(s);
  visibleState.current = s;
  const previous = useRef(s);
  const actions = useRef<any>(null);
  const active =
    screen === 'game' && !paused && !panel && s.status === 'playing';
  const level = LEVELS[s.level],
    cap = capacities(s),
    flow = rates(s),
    part = PARTS[selected],
    day = daylight(s);
  const upgrade = Object.hasOwn(s.upgrades, selected),
    cost = upgrade ? upgradeCost(s, selected) : null;
  useEffect(() => {
    audio.current = new Sound();
    return () => audio.current?.dispose();
  }, []);
  useEffect(() => {
    if (audio.current) {
      audio.current.music = prefs.music;
      audio.current.effects = prefs.effects;
      if (audio.current.musicBus)
        audio.current.musicBus.gain.value = prefs.music ? 0.3 : 0;
    }
    try {
      localStorage.setItem(PREF, JSON.stringify(prefs));
    } catch {
      setSaveOK(false);
    }
  }, [prefs]);
  useEffect(() => {
    if (!active || (tutorial !== null && !TUTORIAL[tutorial].running)) return;
    const id = setInterval(
      () =>
        setS((p: any) => {
          let n = p;
          for (let i = 0; i < speed; i++) n = tick(n, 0.25);
          return n;
        }),
      250,
    );
    return () => clearInterval(id);
  }, [active, speed, tutorial]);
  useEffect(() => {
    const save = () => {
      try {
        localStorage.setItem(SAVE, JSON.stringify(live.current));
      } catch {
        setSaveOK(false);
      }
    };
    const id = setInterval(save, 2000);
    const visibility = () => {
      if (document.hidden) {
        save();
        setPaused(true);
        audio.current?.suspend();
      }
    };
    document.addEventListener('visibilitychange', visibility);
    window.addEventListener('pagehide', save);
    return () => {
      clearInterval(id);
      save();
      document.removeEventListener('visibilitychange', visibility);
      window.removeEventListener('pagehide', save);
    };
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(SAVE, JSON.stringify(live.current));
    } catch {
      setSaveOK(false);
    }
  }, [s.status, s.level]);
  useEffect(() => {
    const p = previous.current;
    if (s.growth > p.growth) audio.current?.fx('grow');
    if (s.event && !p.event) audio.current?.fx('alert');
    if (s.status === 'won' && p.status !== 'won') {
      audio.current?.fx('win');
      setProgress((old) => {
        const n = { ...old, [s.level]: Math.max(old[s.level] || 0, stars(s)) };
        try {
          localStorage.setItem(PROGRESS, JSON.stringify(n));
        } catch {
          setSaveOK(false);
        }
        return n;
      });
    }
    previous.current = s;
  }, [s]);
  useEffect(() => {
    if (!toast) return;
    const id = setTimeout(() => setToast(''), 4000);
    return () => clearTimeout(id);
  }, [toast]);
  function action(a: string, v?: string) {
    if (
      !active ||
      (s.event && a !== 'event') ||
      !tutorialAllows(tutorial, a, v)
    )
      return;
    setS((p: any) => {
      const n = act(p, a, v);
      if (n !== p) audio.current?.fx(a === 'upgrade' ? 'upgrade' : 'click');
      return n;
    });
  }
  function beginTutorial(fromBrief = false) {
    if (tutorial !== null) return;
    practiceBackup.current = {
      world: structuredClone(s),
      view,
      screen: fromBrief ? 'game' : screen,
      paused: fromBrief ? false : paused,
      speed,
    };
    setS(initialState(0));
    setView('plant');
    setSelected('chloroplast');
    setScreen('game');
    setPaused(false);
    setPanel(null);
    setSpeed(1);
    setTutorial(0);
    void audio.current?.start();
  }
  function finishTutorial() {
    const backup = practiceBackup.current;
    if (backup) {
      setS(backup.world);
      setView(backup.view);
      setScreen(backup.screen);
      setPaused(backup.paused);
      setSpeed(backup.speed);
      live.current = backup.world;
      previous.current = backup.world;
    }
    practiceBackup.current = null;
    setTutorial(null);
    setTutorialSeen(true);
    try {
      localStorage.setItem('cellarium-tutorial-v1', 'done');
    } catch {
      setSaveOK(false);
    }
  }
  function chooseCell(i: number) {
    if (tutorial !== null && !(tutorial === 7 && i === 1)) return;
    setS((p: any) => act(p, 'select', String(i)));
  }
  function changeView(next: 'plant' | 'cell') {
    if (
      tutorial !== null &&
      !(
        (tutorial === 1 && next === 'cell') ||
        (tutorial === 10 && next === 'plant')
      )
    )
      return;
    setView(next);
  }
  useEffect(() => {
    if (tutorial === null || !active) return;
    const next = nextTutorialStep(tutorial, s, view);
    if (next !== tutorial) {
      setTutorial(next);
      audio.current?.fx('click');
    }
  }, [tutorial, s, view, active]);
  useEffect(() => {
    if (tutorial === null || !active) return;
    const target = TUTORIAL[tutorial].target;
    const el = target
      ? document.querySelector<HTMLElement>(`[data-tutorial="${target}"]`)
      : null;
    el?.classList.add('tutorial-target');
    if (el && window.innerWidth < 801)
      el.scrollIntoView({ block: 'center', behavior: 'smooth' });
    return () => el?.classList.remove('tutorial-target');
  }, [tutorial, active]);
  function launch(i: number) {
    if (i > 0 && !progress[i - 1]) return;
    setS(initialState(i));
    setSelected('chloroplast');
    setView('plant');
    setScreen('game');
    setPaused(false);
    setPanel('brief');
    void audio.current?.start();
  }
  function chooseLevel(i: number) {
    if (canContinue) {
      setPendingLevel(i);
      setPanel('replace');
    } else launch(i);
  }
  function resume() {
    setScreen('game');
    setPaused(false);
    void audio.current?.start();
  }
  actions.current = { action, setSelected, setPaused };
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      if (
        (e.target as HTMLElement).matches('input,button,select,textarea') ||
        screen !== 'game' ||
        panel
      )
        return;
      if (e.code === 'Space') {
        e.preventDefault();
        setPaused((p) => !p);
        void audio.current?.start();
      }
      if (e.key.toLowerCase() === 'g') actions.current.action('grow');
      if (e.key === 'Escape') setPaused(true);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  }, [screen, panel]);
  useEffect(() => {
    const context = (document as any).modelContext;
    if (!context?.registerTool) return;
    const lifecycle = new AbortController();
    try {
      Promise.resolve(
        context.registerTool(
          {
            name: 'inspect_cell',
            description:
              'Read the current cell resources, goal and scenario. Does not change the game.',
            inputSchema: {
              type: 'object',
              properties: {},
              additionalProperties: false,
            },
            annotations: { readOnlyHint: true },
            execute: (input: unknown) => {
              if (
                !input ||
                typeof input !== 'object' ||
                Object.keys(input).length
              )
                throw new Error('Expected an empty object');
              return {
                scenario: LEVELS[visibleState.current.level].name,
                state: visibleState.current,
                goal: LEVELS[visibleState.current.level].goal,
              };
            },
          },
          { signal: lifecycle.signal },
        ),
      ).catch(() => {});
    } catch {}
    return () => lifecycle.abort();
  }, []);
  const growReason = s.job
    ? 'Growth in progress'
    : s.sugar < 20
      ? 'Need 20 sugar'
      : s.energy < 18
        ? 'Need 18 energy'
        : s.water < 12
          ? 'Need 12 water'
          : s.health < 35
            ? 'Restore health first'
            : '+20 points · costs 20 sugar, 18 energy, 12 water';
  const stress =
    s.water < 10
      ? 'Water is low. Choose Conserve and develop the membrane.'
      : s.sugar < 10
        ? 'Sugar is low. Use Produce in daylight; save reserves at night.'
        : s.energy < 10
          ? 'Energy is low. Let respiration replenish it before investing.'
          : null;
  const failedCell = s.cells.find((c: any) => c.health <= 0) || s;
  const finished = Object.keys(progress).length;
  const canContinue = s.status === 'playing' && s.t > 0;
  return (
    <main className={`shell ${prefs.reduced ? 'reduced' : ''}`}>
      <header>
        <button
          className="brand"
          onClick={() => {
            if (tutorial !== null) {
              finishTutorial();
              return;
            }
            setScreen('menu');
            setPaused(true);
          }}
          aria-label="Cellarium campaign"
        >
          <Leaf size={29} />
          <span>
            CELLARIUM<small>A LITTLE WORLD, ALIVE</small>
          </span>
        </button>
        <div className="header-right">
          <button
            className="tutorial-launch"
            disabled={tutorial !== null}
            onClick={() => beginTutorial()}
          >
            <BookOpen size={15} /> Tutorial
          </button>
          <span className="save-state">
            {saveOK
              ? 'Progress saved on this device'
              : 'Storage unavailable · keep this tab open'}
          </span>
          <button
            className="icon"
            aria-label="Field guide"
            onClick={() => setPanel('guide')}
          >
            <BookOpen size={19} />
          </button>
          <button
            className="icon"
            aria-label="Sound and settings"
            onClick={() => setPanel('settings')}
          >
            <Settings2 size={19} />
          </button>
        </div>
      </header>
      <div className={`world-stage ${view === 'cell' ? 'microscopic' : ''}`}>
        <PlantScene
          growth={screen === 'menu' ? level.goal * 0.45 : s.growth}
          goal={level.goal}
          day={screen === 'menu' || day}
          selected={s.selectedCell}
          onSelect={(i) => {
            chooseCell(i);
            changeView('cell');
          }}
          reduced={prefs.reduced}
          resetKey={resetKey}
          menu={screen === 'menu'}
          visible={screen === 'menu' || view === 'plant'}
        />
        {screen === 'game' && view === 'cell' && (
          <div className="micro-world">
            <CellScene
              selected={selected}
              onSelect={(p) => {
                if (tutorial === null) setSelected(p as keyof typeof PARTS);
              }}
              water={s.water}
              growth={s.cells[s.selectedCell].growth}
              daylight={day}
              reduced={prefs.reduced}
              resetKey={resetKey}
              active={active}
            />
            <div className="micro-grain" />
          </div>
        )}
      </div>
      <div
        style={{ visibility: screen === 'menu' ? 'hidden' : 'visible' }}
        className={`game-surface world-hud ${view === 'cell' ? 'cell-hud' : 'plant-hud'}`}
        inert={
          screen === 'menu' ||
          !!panel ||
          s.status !== 'playing' ||
          !!s.event ||
          paused
            ? true
            : undefined
        }
      >
        <div className="world-top">
          <div className="chapter-caption">
            <span className="eyebrow">
              THE GLASSHOUSE / CHAPTER 0{s.level + 1}
            </span>
            <h1>{level.name}</h1>
            <span className="environment">
              {day ? <Sun size={15} /> : <Moon size={15} />} Day{' '}
              {Math.floor(s.t / 90) + 1} · {day ? 'Daylight' : 'Night'} ·{' '}
              {Math.ceil(day ? 60 - (s.t % 90) : 90 - (s.t % 90))}s to{' '}
              {day ? 'night' : 'sunrise'}
            </span>
          </div>
          <div className="world-top-actions">
            <div className="view-toggle">
              <button
                className={view === 'plant' ? 'active' : ''}
                data-tutorial="plant-view"
                onClick={() => changeView('plant')}
              >
                <Sprout size={16} /> Plant
              </button>
              <button
                className={view === 'cell' ? 'active' : ''}
                data-tutorial="cell-view"
                onClick={() => changeView('cell')}
              >
                <Hexagon size={16} /> Cell
              </button>
            </div>
            <button
              className="icon"
              aria-label="Reset 3D view"
              onClick={() => setResetKey((k) => k + 1)}
            >
              <RotateCcw size={17} />
            </button>
            <button
              className="icon"
              aria-label="Pause game"
              onClick={() => {
                setPaused(true);
                audio.current?.suspend();
              }}
            >
              <Pause size={17} />
            </button>
          </div>
        </div>
        <aside className="harvest-card">
          <div className="eyebrow">YOUR FIRST HARVEST</div>
          <div className="harvest-heading">
            <Cherry size={25} />
            <span>
              <strong>{s.growth}</strong> / {level.goal}
              <small>plant growth points</small>
            </span>
          </div>
          <div className="progress-track">
            <i
              style={{
                width: `${Math.min(100, (s.growth / level.goal) * 100)}%`,
              }}
            />
          </div>
          <div className="harvest-stages">
            {['Sprout', 'Leaves', 'Flowers', 'Fruit'].map((label, i) => (
              <span
                key={label}
                className={s.growth / level.goal >= i / 3 ? 'reached' : ''}
              >
                <i />
                {label}
              </span>
            ))}
          </div>
          <div className="harvest-checks">
            <span className={contributors(s) === 3 ? 'met' : ''}>
              <Check size={13} />
              {contributors(s)}/3 cells contributed 40 points
            </span>
            <span className={totalUpgrades(s) >= 3 ? 'met' : ''}>
              <Check size={13} />
              {Math.min(3, totalUpgrades(s))}/3 developments
            </span>
            <span className={s.t >= level.days * 90 ? 'met' : ''}>
              <Check size={13} />
              Reach day {level.days + 1}
            </span>
            <span className={s.health >= 60 ? 'met' : ''}>
              <Check size={13} />
              Every cell at 60+ health
            </span>
          </div>
        </aside>
        {view === 'plant' && (
          <div className="plant-invitation">
            <span className="eyebrow">A WHOLE PLANT. MANY LIVING CELLS.</span>
            <p>
              {s.growth === 0
                ? 'It starts with three little leaf cells.'
                : s.growth < level.goal * 0.5
                  ? 'Your cells are helping new leaves unfold.'
                  : s.growth < level.goal * 0.8
                    ? 'Flowers are forming. Keep your cells thriving.'
                    : 'The fruit is ripening. Your harvest is close.'}
            </p>
            <button onClick={() => changeView('cell')}>
              Enter {CELLS[s.selectedCell].name.toLowerCase()} cell{' '}
              <ArrowUpRight size={17} />
            </button>
          </div>
        )}
        {view === 'cell' && (
          <aside className="cell-inspector">
            <div className="inspector-top">
              <span className="eyebrow">
                CELL 0{s.selectedCell + 1} / {CELLS[s.selectedCell].tag}
              </span>
              <button
                className="text-icon"
                aria-label="Return to plant"
                onClick={() => changeView('plant')}
              >
                <X size={17} />
              </button>
            </div>
            <div className={`part-portrait ${selected}`}>
              <div className="organelle-glyph">
                <i />
                <i />
                <i />
              </div>
            </div>
            <span className="part-tag" style={{ color: part.color }}>
              {part.tag}
            </span>
            <h2>{part.name}</h2>
            <p>{part.description}</p>
            {upgrade ? (
              <div className="upgrade-box">
                <div className="upgrade-head">
                  <span>Development</span>
                  <span className="pips">
                    {[1, 2, 3].map((n) => (
                      <i
                        key={n}
                        className={s.upgrades[selected] >= n ? 'filled' : ''}
                      />
                    ))}
                  </span>
                </div>
                <p>{part.effect}</p>
                <button
                  className="secondary full"
                  data-tutorial="upgrade"
                  disabled={
                    s.upgrades[selected] >= 3 ||
                    s.sugar < cost!.sugar ||
                    s.energy < cost!.energy
                  }
                  onClick={() => action('upgrade', selected)}
                >
                  {s.upgrades[selected] >= 3 ? (
                    'Fully developed'
                  ) : (
                    <>
                      Develop capacity <ArrowUpRight size={17} />
                    </>
                  )}
                </button>
                {s.upgrades[selected] < 3 && (
                  <div className="cost">
                    <Hexagon size={12} />
                    {cost!.sugar} sugar <Zap size={12} />
                    {cost!.energy} energy
                  </div>
                )}
              </div>
            ) : (
              <p className="part-tip">{part.tip}</p>
            )}
            <div className="share-sugar">
              <span className="eyebrow">HELP ANOTHER CELL</span>
              <div>
                {CELLS.map(
                  (c, i) =>
                    i !== s.selectedCell && (
                      <button
                        key={c.name}
                        disabled={s.sugar < 25 || s.cells[i].sugar > 105}
                        onClick={() => action('share', String(i))}
                      >
                        20 sugar → {c.name}
                      </button>
                    ),
                )}
              </div>
            </div>
          </aside>
        )}
        {s.weather && (
          <div className="world-weather">
            {s.weather.kind === 'cloud' ? (
              <Moon size={16} />
            ) : (
              <Droplets size={16} />
            )}{' '}
            {s.weather.kind === 'cloud'
              ? 'Shade across the leaves'
              : 'A dry spell'}{' '}
            · {Math.ceil(s.weather.until - s.t)}s{' '}
            {s.weather.adapted && '· response active'}
          </div>
        )}
        <div className="bottom-world">
          <div className="cell-switcher">
            <span className="eyebrow">YOUR LEAF CELLS</span>
            {CELLS.map((c, i) => (
              <button
                key={c.name}
                data-tutorial={i === 1 ? 'sheltered' : undefined}
                className={s.selectedCell === i ? 'selected' : ''}
                onClick={() => {
                  chooseCell(i);
                  audio.current?.fx('click');
                }}
              >
                <span className="cell-id">0{i + 1}</span>
                <span>
                  <strong>{c.name}</strong>
                  <small>
                    {s.cells[i].growth} growth · {Math.ceil(s.cells[i].health)}%
                    health
                  </small>
                </span>
                <span
                  className={`cell-life ${s.cells[i].health < 60 ? 'low' : ''}`}
                />
              </button>
            ))}
            <button
              className="speed"
              onClick={() => setSpeed((v) => (v === 1 ? 2 : 1))}
              aria-label={`Game speed ${speed} times`}
            >
              {speed}×
            </button>
          </div>
          {view === 'cell' && (
            <nav className="structure-nav" aria-label="Cell structures">
              {Object.entries(PARTS).map(([id, p]: any) => (
                <button
                  key={id}
                  aria-pressed={selected === id}
                  className={selected === id ? 'selected' : ''}
                  onClick={() => {
                    if (tutorial === null)
                      setSelected(id as keyof typeof PARTS);
                  }}
                >
                  <i style={{ background: p.color }} />
                  {p.name}
                </button>
              ))}
            </nav>
          )}
          <section className="resource-dock">
            <div className="dock-resources" data-tutorial="resources">
              {(['water', 'sugar', 'energy'] as const).map((k) => {
                const Icon = resourceIcons[k];
                return (
                  <div className={`resource ${k}`} key={k}>
                    <Icon size={18} />
                    <div>
                      <span className="resource-label">
                        {k === 'energy' ? 'Energy' : k}
                      </span>
                      <strong>{Math.floor(s[k])}</strong>
                      <small> / {cap[k]}</small>
                    </div>
                    <span className="dock-rate">
                      {flow[k] >= 0.05 ? '+' : ''}
                      {(Math.abs(flow[k]) < 0.05 ? 0 : flow[k]).toFixed(1)}/s
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="dock-priority">
              <span className="eyebrow">
                {CELLS[s.selectedCell].name.toUpperCase()} PRIORITY
              </span>
              <div className="segmented">
                {[
                  ['reserve', 'Conserve'],
                  ['balanced', 'Balance'],
                  ['produce', 'Produce'],
                ].map(([v, label]) => (
                  <button
                    key={v}
                    data-tutorial={v === 'produce' ? 'produce' : undefined}
                    aria-pressed={s.focus === v}
                    className={s.focus === v ? 'chosen' : ''}
                    onClick={() => action('focus', v)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <button
              className="primary grow"
              data-tutorial="grow"
              disabled={!canGrow(s)}
              onClick={() => action('grow')}
            >
              <Sprout size={20} />
              <span>
                {s.job
                  ? `Contributing… ${Math.ceil(s.job.remaining)}s`
                  : 'Support plant growth'}
                <small>{s.job ? 'Your cell is working' : growReason}</small>
              </span>
              {s.job && (
                <i
                  className="job-progress"
                  style={{ width: `${((12 - s.job.remaining) / 12) * 100}%` }}
                />
              )}
            </button>
          </section>
          <div className="world-status">
            <span className={stress ? 'warning' : ''} aria-live="polite">
              {stress || s.notice}
            </span>
            <button
              className="text-button"
              disabled={
                s.sugar < 12 ||
                s.energy < 14 ||
                s.cells[s.selectedCell].health >= 100
              }
              onClick={() => action('repair')}
            >
              <Heart size={13} /> Repair cell · 12 sugar + 14 energy
            </button>
          </div>
        </div>
      </div>
      {screen === 'menu' && !panel && (
        <div className="campaign">
          <div className="campaign-intro">
            <span className="eyebrow">
              <span className="tiny-line" /> A SINGLE-PLAYER SCIENCE GAME
            </span>
            <h1>
              From little cells.
              <br />
              <em>To your first harvest.</em>
            </h1>
            <p>
              A sunlit glasshouse. One tomato seedling. Three leaf cells with a
              whole plant depending on them. Step inside, help them thrive, and
              grow your first fruit.
            </p>
            <div className="intro-actions">
              {canContinue ? (
                <button className="primary" onClick={resume}>
                  <Play size={17} /> Continue your cell <ArrowRight size={18} />
                </button>
              ) : (
                <button
                  className="primary"
                  onClick={() => launch(Math.min(finished, 3))}
                >
                  <Play size={17} />{' '}
                  {finished === 4 ? 'Play again' : 'Begin your journey'}{' '}
                  <ArrowRight size={18} />
                </button>
              )}
              <button className="text-button" onClick={() => setPanel('guide')}>
                How to play <ArrowUpRight size={15} />
              </button>
            </div>
            <div className="campaign-progress">
              <span>{finished} / 4 scenarios complete</span>
              <span>
                {Object.values(progress).reduce(
                  (a: number, b: any) => a + b,
                  0,
                )}{' '}
                / 12 stars
              </span>
            </div>
            <div className="milestone-garden">
              {LEVELS.map((l: any, i: number) => {
                const Icon = rewardIcons[i];
                return (
                  <div className={progress[i] ? 'earned' : ''} key={l.name}>
                    <Icon size={25} />
                    <span>{l.reward}</span>
                  </div>
                );
              })}
            </div>
            <p className="small-note">
              Explore the plant, then dive into its leaf cells. Every
              contribution helps it grow.
            </p>
          </div>
          <div className="level-list">
            <div className="level-list-heading">
              <span className="eyebrow">CHOOSE YOUR CHAPTER</span>
              <span>01 — 04</span>
            </div>
            {LEVELS.map((l: any, i: number) => {
              const locked = i > 0 && !progress[i - 1],
                Icon = rewardIcons[i];
              return (
                <button
                  key={l.name}
                  className={`level-card ${locked ? 'locked' : ''}`}
                  disabled={locked}
                  onClick={() => chooseLevel(i)}
                >
                  <span className="level-num">0{i + 1}</span>
                  <span className="level-card-copy">
                    <strong>{l.name}</strong>
                    <small>
                      {l.habitat} · {l.goal} growth points
                    </small>
                    <span className="level-stars">
                      {progress[i]
                        ? '★'.repeat(progress[i]) + '☆'.repeat(3 - progress[i])
                        : locked
                          ? 'Complete the previous chapter'
                          : 'Ready to explore'}
                    </span>
                  </span>
                  <span className="level-icon">
                    {locked ? <LockKeyhole size={20} /> : <Icon size={27} />}
                  </span>
                </button>
              );
            })}
            <div className="menu-foot">
              <span>
                <Volume2 size={14} /> Original soundscape
              </span>
              <span>
                <Check size={14} /> Saves as you play
              </span>
            </div>
          </div>
        </div>
      )}
      {panel === 'brief' && (
        <Modal>
          <span className="eyebrow">CHAPTER 0{s.level + 1}</span>
          <h2>{level.name}</h2>
          <p>{level.description}</p>
          <div className="brief-goal">
            <Sprout size={28} />
            <div>
              <strong>{level.goal} growth points</strong>
              <span>
                Develop 3 capacities · all 3 cells contribute · reach day{' '}
                {level.days + 1} · finish with 60+ health
              </span>
            </div>
          </div>
          <ol className="steps">
            <li>
              <span>1</span>
              <div>
                <strong>Develop a cell function</strong>
                <p>
                  Enter a leaf cell, select a structure, then invest sugar and
                  energy in its capacity.
                </p>
              </div>
            </li>
            <li>
              <span>2</span>
              <div>
                <strong>Grow when you have reserves</strong>
                <p>
                  Each cell can contribute 20 points at a time. Get at least 40
                  from each of the three cells. Your plant will unfold, flower
                  and fruit.
                </p>
              </div>
            </li>
            <li>
              <span>3</span>
              <div>
                <strong>Respond to your environment</strong>
                <p>
                  Switch between cells, share sugar with struggling neighbours,
                  and prepare each cell for night.
                </p>
              </div>
            </li>
          </ol>
          <button
            className="primary full"
            onClick={() => {
              if (!tutorialSeen && s.level === 0) {
                beginTutorial(true);
                return;
              }
              setPanel(null);
              void audio.current?.start();
            }}
          >
            {!tutorialSeen && s.level === 0
              ? 'Start guided tutorial'
              : 'Bring it to life'}{' '}
            <ArrowRight size={18} />
          </button>
          <p className="small-note">
            Time bonus: finish by {Math.floor(level.bonusTime / 60)}:
            {String(level.bonusTime % 60).padStart(2, '0')}. One game day is 90
            seconds. Pause any time. No progress is lost while you are away.
          </p>
        </Modal>
      )}
      {panel === 'guide' && (
        <Modal wide onClose={() => setPanel(null)}>
          <span className="eyebrow">THE FIELD GUIDE</span>
          <h2>Small structures. Shared purpose.</h2>
          <div className="guide-grid">
            <div>
              <h3>How to win</h3>
              <p>
                Meet all four objectives: the plant growth target, three
                developments, at least 40 points from each cell, the required
                day and at least 60 health in every cell. Growth costs{' '}
                <b>20 sugar, 18 energy and 12 water</b> and takes 12 seconds.
              </p>
              <h3>Find your rhythm</h3>
              <p>
                <b>Produce</b> increases photosynthesis and water use.{' '}
                <b>Conserve</b> reduces both. <b>Balance</b> sits between them.
                These priorities represent changes in activity, not conscious
                cell decisions.
              </p>
              <p>
                At night, photosynthesis stops, but respiration continues. Keep
                sugar in reserve. Repair restores 25 health for 12 sugar and 14
                energy.
              </p>
              <h3>Earn your stars</h3>
              <p>
                One star for completion. Another for finishing with 85+ health.
                A third for finishing within the scenario’s time bonus, shown in
                its briefing. The clock measures game time, so 2× speed does not
                change your score.
              </p>
            </div>
            <div>
              <h3>The science behind the model</h3>
              <p>
                Light + water + carbon dioxide → sugars + oxygen in
                chloroplasts. Respiration transfers energy from food into ATP;
                mitochondria carry out much of this process.
              </p>
              <p>
                All essential structures exist from the start. Developments
                represent increased capacity, not buying missing organs. Carbon
                dioxide, oxygen and mineral supplies are simplified; resource
                numbers are game units, not a balanced chemical equation.
              </p>
              <p>
                Colours, size, time and movement are illustrative. The growing
                plant represents the combined work of many cells. You manage
                three representative photosynthetic leaf cells, not literally
                all its cells. Different leaf positions have different light and
                water conditions. Sharing sugar represents transport between
                cells, simplified here; not all plant cells have chloroplasts.
              </p>
              <a
                href="https://openstax.org/books/concepts-biology/pages/3-3-eukaryotic-cells"
                target="_blank"
                rel="noreferrer"
              >
                Read about cell structures <ArrowUpRight size={14} />
              </a>
              <a
                href="https://openstax.org/books/concepts-biology/pages/5-1-overview-of-photosynthesis"
                target="_blank"
                rel="noreferrer"
              >
                Read about photosynthesis <ArrowUpRight size={14} />
              </a>
            </div>
          </div>
          <div className="guide-bottom">
            <span>
              <kbd>Space</kbd> Pause / resume
            </span>
            <span>
              <kbd>G</kbd> Grow
            </span>
            <span>Drag · orbit / scroll · zoom</span>
          </div>
        </Modal>
      )}
      {panel === 'settings' && (
        <Modal onClose={() => setPanel(null)}>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h2>Sound & settings</h2>
          {[
            ['music', 'Ambient music', Music2],
            ['effects', 'Sound effects', Volume2],
            ['reduced', 'Reduce decorative motion', Leaf],
          ].map(([k, label, Icon]: any) => (
            <button
              key={k}
              className="setting-row"
              role="switch"
              aria-checked={prefs[k]}
              onClick={() => {
                setPrefs((p: any) => ({ ...p, [k]: !p[k] }));
                void audio.current?.start();
              }}
            >
              <span>
                <Icon size={19} />
                {label}
              </span>
              <i className={prefs[k] ? 'on' : ''} />
            </button>
          ))}
          <p className="small-note">
            Music and effects are generated in your browser. The game pauses
            when you leave the tab. Saves stay on this device; there are no
            accounts or leaderboards.
          </p>
          <button
            className="secondary full"
            onClick={() => audio.current?.fx('win')}
          >
            Preview sound effect
          </button>
          {screen === 'game' && tutorial === null && (
            <button
              className="text-button danger-text"
              onClick={() => setPanel('restart')}
            >
              Restart this scenario
            </button>
          )}
        </Modal>
      )}
      {panel === 'replace' && (
        <Modal onClose={() => setPanel(null)}>
          <h2>Start this chapter afresh?</h2>
          <p>
            Your current cell will be replaced. Completed chapters and stars
            will stay saved.
          </p>
          <button className="primary full" onClick={() => launch(pendingLevel)}>
            Begin {LEVELS[pendingLevel].name}
            <ArrowRight size={18} />
          </button>
          <button className="secondary full" onClick={() => setPanel(null)}>
            Keep my current cell
          </button>
        </Modal>
      )}
      {panel === 'restart' && (
        <Modal onClose={() => setPanel(null)}>
          <h2>A fresh start?</h2>
          <p>
            This restarts the current scenario. Your completed chapters and
            stars stay safe.
          </p>
          <button className="primary full" onClick={() => launch(s.level)}>
            Restart scenario <RotateCcw size={16} />
          </button>
          <button className="secondary full" onClick={() => setPanel(null)}>
            Keep playing
          </button>
        </Modal>
      )}
      {screen === 'game' && paused && !panel && s.status === 'playing' && (
        <Modal>
          <span className="eyebrow">TAKE A BREATH</span>
          <h2>Your cell can wait.</h2>
          <p>Everything is paused. Your progress is saved on this device.</p>
          <button
            className="primary full"
            onClick={() => {
              setPaused(false);
              void audio.current?.start();
            }}
          >
            <Play size={17} /> Resume
          </button>
          <button
            className="secondary full"
            onClick={() => {
              if (tutorial !== null) finishTutorial();
              setScreen('menu');
            }}
          >
            Back to chapters
          </button>
          <button className="text-button" onClick={() => setPanel('settings')}>
            Sound & settings
          </button>
        </Modal>
      )}
      {screen === 'game' &&
        s.event &&
        !paused &&
        !panel &&
        s.status === 'playing' && (
          <Modal>
            <span className="eyebrow">
              A CHANGE IN YOUR WORLD · TIME PAUSED
            </span>
            <div className="event-symbol">
              {EVENTS[s.event.index].kind === 'dry' ? (
                <Droplets size={36} />
              ) : EVENTS[s.event.index].kind === 'cloud' ? (
                <Moon size={36} />
              ) : (
                <Heart size={36} />
              )}
            </div>
            <h2>{EVENTS[s.event.index].title}</h2>
            <p>{EVENTS[s.event.index].detail}</p>
            <div className="event-choices">
              {EVENTS[s.event.index].choices.map((c: any) => (
                <button
                  className="choice"
                  key={c.value}
                  disabled={c.cost && s.energy < c.cost}
                  onClick={() => action('event', c.value)}
                >
                  <strong>
                    {c.label}
                    <ArrowRight size={18} />
                  </strong>
                  <span>{c.text}</span>
                </button>
              ))}
            </div>
            <p className="small-note">
              Your response is a simplified management choice. Real cells
              respond through physical and chemical processes.
            </p>
          </Modal>
        )}
      {screen === 'game' && s.status === 'won' && !panel && (
        <Modal>
          <span className="eyebrow">CHAPTER COMPLETE</span>
          <Plant stage={3} />
          <div className="victory-stars" aria-label={`${stars(s)} stars`}>
            {'★'.repeat(stars(s))}
            {'☆'.repeat(3 - stars(s))}
          </div>
          <h2>
            {s.level === 3 ? 'A fruitful journey.' : 'Your first harvest.'}
          </h2>
          <p>
            {s.level === 3
              ? 'You completed all four environments. Your cell supported a thriving plant through every challenge.'
              : 'Three thriving cells helped your plant produce fruit. A new growing challenge awaits.'}
          </p>
          <div className="win-stats">
            <span>
              <strong>{s.growth}</strong>growth points
            </span>
            <span>
              <strong>{Math.ceil(s.health)}%</strong>health
            </span>
            <span>
              <strong>
                {Math.floor(s.t / 60)}:
                {String(Math.floor(s.t % 60)).padStart(2, '0')}
              </strong>
              game time
            </span>
          </div>
          <button
            className="primary full"
            onClick={() =>
              s.level < 3 ? launch(s.level + 1) : setScreen('menu')
            }
          >
            {s.level < 3 ? 'Explore the next chapter' : 'View your garden'}
            <ArrowRight size={18} />
          </button>
          <button
            className="text-button"
            onClick={() => {
              if (tutorial !== null) finishTutorial();
              setScreen('menu');
            }}
          >
            Back to chapters
          </button>
          <p className="small-note">
            Your three representative leaf cells supported growth in the whole
            plant.
          </p>
        </Modal>
      )}
      {screen === 'game' && s.status === 'lost' && !panel && (
        <Modal>
          <span className="eyebrow">EVERY ATTEMPT TEACHES YOU SOMETHING</span>
          <h2>Let’s find a new balance.</h2>
          <p>
            A leaf cell ran out of{' '}
            {failedCell.water < 5
              ? 'water'
              : failedCell.sugar < 2
                ? 'sugar'
                : 'usable energy'}
            . Try{' '}
            {failedCell.water < 5
              ? 'Conserve priority and an early membrane development.'
              : failedCell.sugar < 2
                ? 'developing chloroplast capacity and saving sugar before night.'
                : 'developing mitochondria and leaving energy in reserve.'}
          </p>
          <div className="brief-goal">
            <Sprout />
            <strong>
              {s.growth} / {level.goal} growth points reached
            </strong>
          </div>
          <button className="primary full" onClick={() => launch(s.level)}>
            Try again <RotateCcw size={18} />
          </button>
          <button
            className="secondary full"
            onClick={() => {
              if (tutorial !== null) finishTutorial();
              setScreen('menu');
            }}
          >
            Back to chapters
          </button>
        </Modal>
      )}
      {tutorial !== null && active && !s.event && (
        <section
          className={`tutorial-coach ${[1, 10].includes(tutorial) ? 'tutorial-view-step' : ''}`}
          role="region"
          aria-label="Guided tutorial"
        >
          <div className="tutorial-heading">
            <span>
              PRACTICE · {tutorial + 1} / {TUTORIAL.length}
            </span>
            <button onClick={finishTutorial} aria-label="Exit tutorial">
              Exit practice <X size={13} />
            </button>
          </div>
          <div className="tutorial-progress">
            <i
              style={{ width: `${((tutorial + 1) / TUTORIAL.length) * 100}%` }}
            />
          </div>
          <div aria-live="polite" aria-atomic="true">
            <h2>{TUTORIAL[tutorial].title}</h2>
            <p>{TUTORIAL[tutorial].text}</p>
          </div>
          {tutorial === 0 ? (
            <button className="primary full" onClick={() => setTutorial(1)}>
              Show me how <ArrowRight size={16} />
            </button>
          ) : tutorial === 11 ? (
            <button className="primary full" onClick={finishTutorial}>
              Return to my plant <ArrowRight size={16} />
            </button>
          ) : (
            <div className="tutorial-instruction">
              {TUTORIAL[tutorial].running
                ? 'Time is running · watch what changes'
                : 'Time is stopped · follow the glowing control'}
            </div>
          )}
        </section>
      )}
      {toast && (
        <div className="toast" role="status">
          {toast}
        </div>
      )}
    </main>
  );
}
