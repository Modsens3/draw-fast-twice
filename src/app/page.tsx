'use client';

import { useEffect, useRef } from 'react';
import type { Button } from '../game/input-types';

export default function Home() {
  const hostRef = useRef<HTMLDivElement>(null);
  const pressRef = useRef<(btn: Button, down: boolean) => void>(() => {});

  useEffect(() => {
    let destroyed = false;
    let cleanup = () => {};
    // The engine touches document/canvas at import time in places, so load it client-side only.
    import('../game/game').then(({ Game }) => {
      if (destroyed || !hostRef.current) return;
      const game = new Game();
      game.start(hostRef.current);
      pressRef.current = (btn, down) =>
        down ? game.input.virtualDown(btn) : game.input.virtualUp(btn);

      const resize = () => {
        const wrap = hostRef.current;
        if (!wrap) return;
        const controls = document.querySelector('.touch-controls');
        const controlsH = controls ? (controls as HTMLElement).offsetHeight + 24 : 0;
        const availW = window.innerWidth - 16;
        const availH = window.innerHeight - controlsH - 16;
        const scale = Math.max(1, Math.floor(Math.min(availW / 160, availH / 144)));
        game.screen.canvas.style.width = `${160 * scale}px`;
        game.screen.canvas.style.height = `${144 * scale}px`;
      };
      resize();
      window.addEventListener('resize', resize);
      cleanup = () => {
        window.removeEventListener('resize', resize);
        game.destroy();
      };
    });
    return () => {
      destroyed = true;
      cleanup();
    };
  }, []);

  const bind = (btn: Button) => ({
    onPointerDown: (e: React.PointerEvent) => {
      e.preventDefault();
      pressRef.current(btn, true);
    },
    onPointerUp: () => pressRef.current(btn, false),
    onPointerLeave: () => pressRef.current(btn, false),
    onContextMenu: (e: React.MouseEvent) => e.preventDefault(),
  });

  return (
    <main className="game-root">
      <div className="screen-wrap" ref={hostRef} />
      <div className="touch-controls">
        <div className="dpad">
          <button className="up" {...bind('UP')}>
            ▲
          </button>
          <button className="left" {...bind('LEFT')}>
            ◀
          </button>
          <button className="right" {...bind('RIGHT')}>
            ▶
          </button>
          <button className="down" {...bind('DOWN')}>
            ▼
          </button>
        </div>
        <div className="action-buttons">
          <div className="ab-row">
            <button {...bind('B')}>B</button>
            <button {...bind('A')}>A</button>
          </div>
          <div className="start-row">
            <button {...bind('START')}>START</button>
          </div>
        </div>
      </div>
    </main>
  );
}
