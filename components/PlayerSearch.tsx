"use client";

import { useDeferredValue, useEffect, useState } from "react";
import type { PlayerRecord } from "@/lib/types";

type PlayerSearchProps = {
  isOpen: boolean;
  cellLabel: string;
  players: PlayerRecord[];
  usedPlayerIds: string[];
  onClose: () => void;
  onSubmit: (playerName: string) => void;
};

export default function PlayerSearch({
  isOpen,
  cellLabel,
  players,
  usedPlayerIds,
  onClose,
  onSubmit,
}: PlayerSearchProps) {
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);

  useEffect(() => {
    if (isOpen) {
      setQuery("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  const normalizedQuery = deferredQuery.trim().toLowerCase();
  const usedPlayerSet = new Set(usedPlayerIds);
  const filteredPlayers = players
    .filter((player) => !usedPlayerSet.has(player.id))
    .filter((player) =>
      normalizedQuery === ""
        ? true
        : player.name.toLowerCase().includes(normalizedQuery) ||
          player.aliases.some((alias) => alias.toLowerCase().includes(normalizedQuery)),
    )
    .slice(0, 5);

  return (
    <div className="search-backdrop" role="presentation" onClick={onClose}>
      <div
        aria-modal="true"
        className="search-panel"
        role="dialog"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="search-header">
          <div>
            <p className="eyebrow">Select A Player</p>
            <h2 className="search-title">{cellLabel}</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose}>
            Close
          </button>
        </div>

        <form
          className="search-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (query.trim()) {
              onSubmit(query.trim());
              onClose();
            }
          }}
        >
          <input
            autoFocus
            className="search-input"
            placeholder="Type a player name"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
          <button className="button" type="submit" disabled={!query.trim()}>
            Check
          </button>
        </form>

        <p className="helper-text">
          Unused players matching your search. Click one to fill the input, then press Check.
        </p>

        <div className="search-list">
          {filteredPlayers.length > 0 ? (
            filteredPlayers.map((player) => (
              <button
                key={player.id}
                className="search-option"
                type="button"
                onClick={() => setQuery(player.name)}
              >
                <span className="search-option-name">{player.name}</span>
                <span className="search-option-meta">Fill this player into the search box</span>
              </button>
            ))
          ) : (
            <div className="empty-state">No unused players matched your search.</div>
          )}
        </div>
      </div>
    </div>
  );
}
