import { useEffect, useState } from "react";
import type { FormEvent } from "react";
import {
  fetchHeadToHead,
  fetchHealth,
  fetchPlayerComps,
  fetchPlayerImpact,
  fetchPlayerOptions,
  fetchPlayerProfile,
  fetchPlayerTrajectory,
  fetchTeamEfficiency,
  fetchTeamNeedGap,
  fetchTeamOptions,
} from "../utils/dashboardApi";
import {
  getComparableSplitMetrics,
  toPositiveInt,
} from "../utils/dashboardFormatters";
import type {
  PlayerOption,
  CompSplitMode,
  PlayerCompsResponse,
  PlayerImpactResponse,
  PlayerProfile,
  PlayerTrajectoryResponse,
  TeamSeasonType,
  TeamNeedGapResponse,
  TeamOption,
  TeamEfficiencyResponse,
} from "../utils/dashboardTypes";
import ComparePortal from "./features/ComparePortal";
import CompsPortal from "./features/CompsPortal";
import ImpactPortal from "./features/ImpactPortal";
import ProfilePortal from "./features/ProfilePortal";
import TeamPortal from "./features/TeamPortal";
import TrajectoryPortal from "./features/TrajectoryPortal";

const Dashboard = () => {
  const [activeFeature, setActiveFeature] = useState<
    "profile" | "compare" | "impact" | "comps" | "trajectory" | "team"
  >("profile");
  const [healthToast, setHealthToast] = useState("");
  const [playerId, setPlayerId] = useState("1966");
  const [playerBId, setPlayerBId] = useState("3945274");
  const [impactPlayerId, setImpactPlayerId] = useState("1966");
  const [compsPlayerId, setCompsPlayerId] = useState("1966");
  const [trajectoryPlayerId, setTrajectoryPlayerId] = useState("1966");
  const [teamId, setTeamId] = useState("10");
  const [impactGames, setImpactGames] = useState("10");
  const [impactSeasonType, setImpactSeasonType] =
    useState<TeamSeasonType>("all");
  const [teamGames, setTeamGames] = useState("5");
  const [compLimit, setCompLimit] = useState("10");
  const [compSampleSize, setCompSampleSize] = useState("100");
  const [compSplit, setCompSplit] = useState<CompSplitMode>("regular");
  const [trajectoryGames, setTrajectoryGames] = useState("20");
  const [trajectoryWindow, setTrajectoryWindow] = useState("5");
  const [trajectorySeasonType, setTrajectorySeasonType] =
    useState<TeamSeasonType>("all");
  const [teamSeasonType, setTeamSeasonType] = useState<TeamSeasonType>("all");
  const [teamQuery, setTeamQuery] = useState("");
  const [forceRefresh, setForceRefresh] = useState(false);
  const [playerOptions, setPlayerOptions] = useState<PlayerOption[]>([]);
  const [teamOptions, setTeamOptions] = useState<TeamOption[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [loadingTeamOptions, setLoadingTeamOptions] = useState(false);

  const [player, setPlayer] = useState<PlayerProfile | null>(null);
  const [comparison, setComparison] = useState<PlayerProfile[]>([]);
  const [impact, setImpact] = useState<PlayerImpactResponse | null>(null);
  const [playerComps, setPlayerComps] = useState<PlayerCompsResponse | null>(
    null,
  );
  const [playerTrajectory, setPlayerTrajectory] =
    useState<PlayerTrajectoryResponse | null>(null);
  const [teamEfficiency, setTeamEfficiency] =
    useState<TeamEfficiencyResponse | null>(null);
  const [teamNeedGap, setTeamNeedGap] = useState<TeamNeedGapResponse | null>(
    null,
  );
  const [error, setError] = useState<string>("");
  const [loadingSingle, setLoadingSingle] = useState(false);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [loadingImpact, setLoadingImpact] = useState(false);
  const [loadingComps, setLoadingComps] = useState(false);
  const [loadingTrajectory, setLoadingTrajectory] = useState(false);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    const loadOptions = async () => {
      setLoadingOptions(true);
      setLoadingTeamOptions(true);
      try {
        const [playerResult, teamResult] = await Promise.allSettled([
          fetchPlayerOptions(forceRefresh),
          fetchTeamOptions(forceRefresh),
        ]);

        if (playerResult.status === "fulfilled") {
          const options = playerResult.value;
          if (options.length) {
            setPlayerOptions(options);

            if (!options.some((option) => option.id === playerId)) {
              setPlayerId(options[0].id);
            }

            if (!options.some((option) => option.id === playerBId)) {
              setPlayerBId(options[0].id);
            }

            if (!options.some((option) => option.id === impactPlayerId)) {
              setImpactPlayerId(options[0].id);
            }

            if (!options.some((option) => option.id === compsPlayerId)) {
              setCompsPlayerId(options[0].id);
            }

            if (!options.some((option) => option.id === trajectoryPlayerId)) {
              setTrajectoryPlayerId(options[0].id);
            }
          }
        } else {
          setError(
            "Failed to load player selector options from backend route /players/options.",
          );
        }

        if (teamResult.status === "fulfilled") {
          const options = teamResult.value;
          if (options.length) {
            setTeamOptions(options);
            if (!options.some((option) => option.id === teamId)) {
              setTeamId(options[0].id);
            }
          }
        } else {
          setError(
            "Failed to load team selector options from backend route /teams.",
          );
        }
      } finally {
        setLoadingOptions(false);
        setLoadingTeamOptions(false);
      }
    };

    void loadOptions();
  }, [forceRefresh]);

  useEffect(() => {
    const trimmedQuery = teamQuery.trim();

    if (!trimmedQuery) {
      return;
    }

    const timer = window.setTimeout(async () => {
      try {
        const options = await fetchTeamOptions(forceRefresh, trimmedQuery);
        if (options.length) {
          setTeamOptions(options);
        }
      } catch {
        setError("Failed to search teams from backend route /teams.");
      }
    }, 240);

    return () => window.clearTimeout(timer);
  }, [teamQuery, forceRefresh]);

  const checkHealth = async () => {
    setError("");
    try {
      await fetchHealth();
      setHealthToast("Basketball analytics backend is running");
      window.setTimeout(() => setHealthToast(""), 3000);
    } catch {
      setError(
        "Could not reach backend health endpoint. Confirm API URL and backend server status.",
      );
    }
  };

  const fetchPlayer = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(playerId);

    if (!id) {
      setError("Player ID must be a positive integer.");
      return;
    }

    setLoadingSingle(true);
    try {
      const profile = await fetchPlayerProfile(id, forceRefresh);
      setPlayer(profile);
    } catch {
      setError(`Failed to load player ${id}. Check backend route and ID.`);
    } finally {
      setLoadingSingle(false);
    }
  };

  const loadPlayerComps = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(compsPlayerId);
    const limit = Math.max(1, Math.min(toPositiveInt(compLimit) ?? 10, 25));
    const sampleSize = Math.max(
      30,
      Math.min(toPositiveInt(compSampleSize) ?? 100, 120),
    );

    if (!id) {
      setError("Comps player ID must be a positive integer.");
      return;
    }

    setLoadingComps(true);
    try {
      const data = await fetchPlayerComps(
        id,
        forceRefresh,
        limit,
        sampleSize,
        compSplit,
      );
      setPlayerComps(data);
    } catch {
      setError(
        `Failed to load comps for athlete ${id}. Confirm backend /players/:athleteId/comps route.`,
      );
    } finally {
      setLoadingComps(false);
    }
  };

  const loadPlayerTrajectory = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(trajectoryPlayerId);
    const games = Math.max(
      5,
      Math.min(toPositiveInt(trajectoryGames) ?? 20, 30),
    );
    const window = Math.max(
      2,
      Math.min(toPositiveInt(trajectoryWindow) ?? 5, 20),
    );

    if (!id) {
      setError("Trajectory player ID must be a positive integer.");
      return;
    }

    setLoadingTrajectory(true);
    try {
      const data = await fetchPlayerTrajectory(
        id,
        forceRefresh,
        games,
        window,
        trajectorySeasonType,
      );
      setPlayerTrajectory(data);
    } catch {
      setError(
        `Failed to load trajectory for athlete ${id}. Confirm backend /players/:athleteId/trajectory route.`,
      );
    } finally {
      setLoadingTrajectory(false);
    }
  };

  const comparePlayers = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const a = toPositiveInt(playerId);
    const b = toPositiveInt(playerBId);

    if (!a || !b) {
      setError("Both comparison IDs must be positive integers.");
      return;
    }

    setLoadingCompare(true);
    try {
      const players = await fetchHeadToHead(a, b, forceRefresh);
      setComparison(players);
    } catch {
      setError(
        "Comparison request failed. Confirm both IDs exist and backend is running.",
      );
    } finally {
      setLoadingCompare(false);
    }
  };

  const loadPlayerImpact = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(impactPlayerId);
    const games = toPositiveInt(impactGames) ?? 10;

    if (!id) {
      setError("Impact player ID must be a positive integer.");
      return;
    }

    setLoadingImpact(true);
    try {
      const data = await fetchPlayerImpact(
        id,
        forceRefresh,
        games,
        impactSeasonType,
      );
      setImpact(data);
    } catch {
      setError(
        `Failed to load player impact for athlete ${id}. Confirm backend /players/:athleteId/impact route.`,
      );
    } finally {
      setLoadingImpact(false);
    }
  };

  const loadTeamEfficiency = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const id = toPositiveInt(teamId);
    const games = Math.max(1, Math.min(toPositiveInt(teamGames) ?? 5, 15));

    if (!id) {
      setError("Team ID must be a positive integer.");
      return;
    }

    setLoadingTeam(true);
    try {
      const [efficiencyResult, needGapResult] = await Promise.allSettled([
        fetchTeamEfficiency(id, forceRefresh, games, teamSeasonType),
        fetchTeamNeedGap(id, forceRefresh, games, teamSeasonType),
      ]);

      if (efficiencyResult.status === "fulfilled") {
        setTeamEfficiency(efficiencyResult.value);
      } else {
        throw new Error("team-efficiency-fetch-failed");
      }

      if (needGapResult.status === "fulfilled") {
        setTeamNeedGap(needGapResult.value);
      } else {
        setTeamNeedGap(null);
      }
    } catch {
      setError(
        `Failed to load team efficiency for team ${id}. Confirm backend /teams/:teamId/efficiency route.`,
      );
    } finally {
      setLoadingTeam(false);
    }
  };

  const compareSplitGroups =
    comparison.length >= 2
      ? getComparableSplitMetrics(comparison[0], comparison[1])
      : [];

  return (
    <main className="dashboard-shell">
      <header className="hero-strip dashboard-hero">
        <div className="dashboard-hero__content">
          <div className="dashboard-hero__title-row">
            <div>
              {/* <p className="kicker">Live scouting workspace</p> */}
              <h1>NBA Analytics Tool</h1>
            </div>

            <div className="dashboard-utility-row">
              <button type="button" onClick={checkHealth}>
                Check API Health
              </button>
              <div className="toggle-help-group">
                <label className="toggle-row">
                  <input
                    type="checkbox"
                    checked={forceRefresh}
                    onChange={(event) => setForceRefresh(event.target.checked)}
                  />
                  Bypass Cache
                </label>
                <button
                  type="button"
                  className="help-icon"
                  aria-label="Bypass Cache help"
                  title="Bypass Cache forces the dashboard to fetch fresh data from the backend instead of using cached results."
                >
                  i
                </button>
              </div>
            </div>
          </div>

          {healthToast ? (
            <div className="health-toast" role="status" aria-live="polite">
              {healthToast}
            </div>
          ) : null}

          <nav
            className="feature-switch dashboard-feature-switch"
            role="tablist"
            aria-label="Feature navigation"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeFeature === "profile"}
              className={`feature-tab ${activeFeature === "profile" ? "active" : ""}`}
              onClick={() => setActiveFeature("profile")}
              title="Single player profile with summary splits and core production chart."
            >
              Profile
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFeature === "compare"}
              className={`feature-tab ${activeFeature === "compare" ? "active" : ""}`}
              onClick={() => setActiveFeature("compare")}
              title="Head-to-head profile comparison across matching split types."
            >
              Compare
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFeature === "impact"}
              className={`feature-tab ${activeFeature === "impact" ? "active" : ""}`}
              onClick={() => setActiveFeature("impact")}
              title="Recent plus-minus trend and game-level context."
            >
              Impact
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFeature === "comps"}
              className={`feature-tab ${activeFeature === "comps" ? "active" : ""}`}
              onClick={() => setActiveFeature("comps")}
              title="Player Value Comps based on normalized stat similarity."
            >
              Value Comps
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFeature === "trajectory"}
              className={`feature-tab ${activeFeature === "trajectory" ? "active" : ""}`}
              onClick={() => setActiveFeature("trajectory")}
              title="Development curve using rolling averages and trend direction."
            >
              Dev Curve
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeFeature === "team"}
              className={`feature-tab ${activeFeature === "team" ? "active" : ""}`}
              onClick={() => setActiveFeature("team")}
              title="Team efficiencies plus need-gap analysis against league benchmark."
            >
              Team Eff + Needs
            </button>
          </nav>

          {error ? <p className="error-note">{error}</p> : null}
        </div>
      </header>

      {activeFeature === "profile" ? (
        <ProfilePortal
          playerId={playerId}
          playerOptions={playerOptions}
          player={player}
          loadingOptions={loadingOptions}
          loadingSingle={loadingSingle}
          onPlayerIdChange={setPlayerId}
          onSubmit={fetchPlayer}
        />
      ) : activeFeature === "compare" ? (
        <ComparePortal
          playerId={playerId}
          playerBId={playerBId}
          playerOptions={playerOptions}
          comparison={comparison}
          compareSplitGroups={compareSplitGroups}
          loadingOptions={loadingOptions}
          loadingCompare={loadingCompare}
          onPlayerIdChange={setPlayerId}
          onPlayerBIdChange={setPlayerBId}
          onSubmit={comparePlayers}
        />
      ) : activeFeature === "impact" ? (
        <ImpactPortal
          impactPlayerId={impactPlayerId}
          impactGames={impactGames}
          impactSeasonType={impactSeasonType}
          playerOptions={playerOptions}
          impact={impact}
          loadingOptions={loadingOptions}
          loadingImpact={loadingImpact}
          onImpactPlayerIdChange={setImpactPlayerId}
          onImpactGamesChange={setImpactGames}
          onImpactSeasonTypeChange={setImpactSeasonType}
          onSubmit={loadPlayerImpact}
        />
      ) : activeFeature === "comps" ? (
        <CompsPortal
          compsPlayerId={compsPlayerId}
          compLimit={compLimit}
          compSampleSize={compSampleSize}
          compSplit={compSplit}
          playerOptions={playerOptions}
          playerComps={playerComps}
          loadingOptions={loadingOptions}
          loadingComps={loadingComps}
          onCompsPlayerIdChange={setCompsPlayerId}
          onCompLimitChange={setCompLimit}
          onCompSampleSizeChange={setCompSampleSize}
          onCompSplitChange={setCompSplit}
          onSubmit={loadPlayerComps}
        />
      ) : activeFeature === "trajectory" ? (
        <TrajectoryPortal
          trajectoryPlayerId={trajectoryPlayerId}
          trajectoryGames={trajectoryGames}
          trajectoryWindow={trajectoryWindow}
          trajectorySeasonType={trajectorySeasonType}
          playerOptions={playerOptions}
          playerTrajectory={playerTrajectory}
          loadingOptions={loadingOptions}
          loadingTrajectory={loadingTrajectory}
          onTrajectoryPlayerIdChange={setTrajectoryPlayerId}
          onTrajectoryGamesChange={setTrajectoryGames}
          onTrajectoryWindowChange={setTrajectoryWindow}
          onTrajectorySeasonTypeChange={setTrajectorySeasonType}
          onSubmit={loadPlayerTrajectory}
        />
      ) : (
        <TeamPortal
          teamId={teamId}
          teamGames={teamGames}
          teamSeasonType={teamSeasonType}
          teamOptions={teamOptions}
          teamEfficiency={teamEfficiency}
          teamNeedGap={teamNeedGap}
          loadingTeam={loadingTeam}
          loadingTeamOptions={loadingTeamOptions}
          onTeamIdChange={(nextId) => {
            setTeamId(nextId);
            setTeamQuery("");
          }}
          onTeamGamesChange={setTeamGames}
          onTeamSeasonTypeChange={setTeamSeasonType}
          onTeamQueryChange={setTeamQuery}
          onSubmit={loadTeamEfficiency}
        />
      )}
    </main>
  );
};

export default Dashboard;
