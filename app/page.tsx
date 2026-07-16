"use client";

import { useState } from "react";
import { Dashboard } from "./pawmuse/Dashboard";
import { Gallery } from "./pawmuse/Gallery";
import { Sidebar } from "./pawmuse/Sidebar";
import { COMPLETE_STORY_PROGRESS, EMPTY_STORY_PROGRESS, type AppView, type StoryProgress } from "./pawmuse/types";
import { Workspace } from "./pawmuse/Workspace";

export default function Page() {
  const [view, setView] = useState<AppView>("dashboard");
  const [storeIntent, setStoreIntent] = useState<{ category: string; existing: boolean }>({ category: "宠物店", existing: true });
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(COMPLETE_STORY_PROGRESS);

  const openStore = (category: string, existing: boolean) => {
    setStoreIntent({ category, existing });
    setStoryProgress(existing ? COMPLETE_STORY_PROGRESS : EMPTY_STORY_PROGRESS);
    setView("workspace");
  };

  return (
    <div className="app-viewport">
      <div className={`app-canvas flex overflow-hidden bg-[var(--paper)] ${view === "dashboard" ? "app-canvas--initial" : ""}`}>
        <Sidebar activeView={view} onNavigate={setView} />
        {view === "dashboard" && <Dashboard onStartStore={(category) => openStore(category, false)} onOpenStore={(category) => openStore(category, true)} />}
        {view === "workspace" && <Workspace initialCategory={storeIntent.category} existingStore={storeIntent.existing} progress={storyProgress} onProgressChange={setStoryProgress} />}
        {view === "gallery" && <Gallery progress={storyProgress} onOpenWorkspace={() => setView("workspace")} />}
      </div>
    </div>
  );
}
