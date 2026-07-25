"use client";

import { useState } from "react";
import { Dashboard } from "./pawmuse/Dashboard";
import { Gallery } from "./pawmuse/Gallery";
import { Sidebar } from "./pawmuse/Sidebar";
import { COMPLETE_STORY_PROGRESS, EMPTY_STORY_PROGRESS, type AppView, type BrandType, type StoryProgress } from "./pawmuse/types";
import { Workspace } from "./pawmuse/Workspace";

export default function Page() {
  const [view, setView] = useState<AppView>("dashboard");
  const [brandIntent, setBrandIntent] = useState<{ type: BrandType; category: string; existing: boolean }>({ type: "store", category: "宠物店", existing: true });
  const [storyProgress, setStoryProgress] = useState<StoryProgress>(COMPLETE_STORY_PROGRESS);

  const openBrand = (type: BrandType, category: string, existing: boolean) => {
    setBrandIntent({ type, category, existing });
    setStoryProgress(existing ? COMPLETE_STORY_PROGRESS : EMPTY_STORY_PROGRESS);
    setView("workspace");
  };

  return (
    <div className="app-viewport">
      <div className={`app-canvas flex overflow-hidden bg-[var(--paper)] ${view === "dashboard" ? "app-canvas--initial" : ""}`}>
        <Sidebar activeView={view} onNavigate={setView} />
        {view === "dashboard" && <Dashboard onStartBrand={(type, category) => openBrand(type, category, false)} onOpenStore={() => openBrand("store", "宠物店", true)} />}
        {view === "workspace" && <Workspace brandType={brandIntent.type} initialCategory={brandIntent.category} existingStore={brandIntent.existing} progress={storyProgress} onProgressChange={setStoryProgress} />}
        {view === "gallery" && <Gallery progress={storyProgress} onOpenWorkspace={() => setView("workspace")} />}
      </div>
    </div>
  );
}
