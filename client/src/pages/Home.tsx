import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { getLoginUrl } from "@/const";
import { Gamepad2, Zap, Shield, Wand2, ArrowRight, Heart, Clock, TrendingUp, BookOpen, Sword, Flame, Trophy, Gift, Users, LogOut } from "lucide-react";

const CLASSES = [
  { name: "wizard", icon: Wand2, label: "마법사", desc: "마나를 활용한 강력한 마법 공격" },
  { name: "warrior", icon: Shield, label: "검사", desc: "높은 방어력과 체력" },
  { name: "archer", icon: ArrowRight, label: "궁수", desc: "빠른 공격 속도와 민첩성" },
  { name: "priest", icon: Heart, label: "성직자", desc: "치유와 보호 능력" },
];

const DIFFICULTIES = [
  { value: "easy", label: "쉬움", multiplier: "1배" },
  { value: "normal", label: "보통", multiplier: "1.5배" },
  { value: "hard", label: "어려움", multiplier: "2배" },
];

export default function Home() {
  const { user, isAuthenticated, logout } = useAuth();
  const [selectedClass, setSelectedClass] = useState("wizard");
  const [selectedDifficulty, setSelectedDifficulty] = useState("normal");
  const [characterName, setCharacterName] = useState("");
  const [showCreation, setShowCreation] = useState(false);
  const [selectedCharacterId, setSelectedCharacterId] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [activeTab, setActiveTab] = useState<"game" | "shop" | "quests" | "achievements" | "leaderboard">("game");

  const charactersQuery = trpc.game.getCharacters.useQuery(undefined, { enabled: isAuthenticated });
  const characterQuery = trpc.game.getCharacter.useQuery(
    { characterId: selectedCharacterId || 0 },
    { enabled: !!selectedCharacterId }
  );
  const bosseQuery = trpc.game.getBosses.useQuery(
    { characterId: selectedCharacterId || 0 },
    { enabled: !!selectedCharacterId }
  );
  const equipmentQuery = trpc.game.getEquipment.useQuery(
    { characterId: selectedCharacterId || 0 },
    { enabled: !!selectedCharacterId }
  );
  const questsQuery = trpc.game.getQuests.useQuery(
    { characterId: selectedCharacterId || 0 },
    { enabled: !!selectedCharacterId }
  );
  const achievementsQuery = trpc.game.getAchievements.useQuery(
    { characterId: selectedCharacterId || 0 },
    { enabled: !!selectedCharacterId }
  );
  const leaderboardQuery = trpc.game.getLeaderboard.useQuery();

  const createCharacterMutation = trpc.game.createCharacter.useMutation({
    onSuccess: () => {
      charactersQuery.refetch();
      setShowCreation(false);
      setCharacterName("");
    },
  });
  const completePomodoroMutation = trpc.game.completePomodoroSession.useMutation({
    onSuccess: () => {
      characterQuery.refetch();
      setTimerActive(false);
      setTimeLeft(25 * 60);
    },
  });
  const attackBossMutation = trpc.game.attackBoss.useMutation({
    onSuccess: () => {
      bosseQuery.refetch();
      characterQuery.refetch();
    },
  });
  const buyEquipmentMutation = trpc.game.buyEquipment.useMutation({
    onSuccess: () => {
      equipmentQuery.refetch();
      characterQuery.refetch();
    },
  });
  const deleteCharacterMutation = trpc.game.deleteCharacter.useMutation({
    onSuccess: () => {
      charactersQuery.refetch();
      setSelectedCharacterId(null);
    },
  });
  const completeQuestMutation = trpc.game.completeQuest.useMutation({
    onSuccess: () => {
      questsQuery.refetch();
      characterQuery.refetch();
    },
  });

  useEffect(() => {
    if (!timerActive || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setTimerActive(false);
          if (selectedCharacterId) {
            completePomodoroMutation.mutate({
              characterId: selectedCharacterId,
              duration: 25,
            });
          }
          return 25 * 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timerActive, timeLeft, selectedCharacterId]);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-premium flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-2xl animate-slide-up">
          <div className="text-center space-y-8 mb-12">
            <div className="space-y-4">
              <div className="flex justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-purple-600 to-pink-600 rounded-2xl shadow-premium-lg">
                  <Gamepad2 className="w-16 h-16 text-white" />
                </div>
              </div>
              <h1 className="text-5xl font-bold text-white">Pomodoro RPG</h1>
              <p className="text-xl text-purple-200">집중력을 키우고 경험치를 얻는 판타지 타이머</p>
            </div>

            <div className="card-premium p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">게임 방식</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex gap-3">
                    <Wand2 className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="text-left">
                      <p className="text-purple-300 font-semibold">4가지 클래스</p>
                      <p className="text-purple-200 text-sm">마법사, 검사, 궁수, 성직자</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Clock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="text-left">
                      <p className="text-purple-300 font-semibold">포모도로 타이머</p>
                      <p className="text-purple-200 text-sm">25분 집중 세션</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <TrendingUp className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="text-left">
                      <p className="text-purple-300 font-semibold">경험치 획득</p>
                      <p className="text-purple-200 text-sm">세션 완료 시 보상</p>
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <Sword className="w-5 h-5 text-purple-400 flex-shrink-0 mt-1" />
                    <div className="text-left">
                      <p className="text-purple-300 font-semibold">보스 전투</p>
                      <p className="text-purple-200 text-sm">도전 과제 완료</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <a href={getLoginUrl()} className="block">
            <Button className="w-full btn-premium py-6 text-lg">
              로그인하여 시작하기
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const character = characterQuery.data;
  const characters = charactersQuery.data || [];

  // Derived values for timer UI (safe to compute even when character is undefined)
  const SESSION_TOTAL = 25 * 60;
  const sessionProgress = 1 - timeLeft / SESSION_TOTAL;
  const RING_RADIUS = 80;
  const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;
  const ringOffset = RING_CIRCUMFERENCE * (1 - sessionProgress);

  const difficultyXpMap: Record<string, number> = { easy: 10, normal: 15, hard: 20 };
  const xpPreview = difficultyXpMap[character?.difficulty ?? "normal"] ?? 15;

  const currentXp = character?.experience ?? 0;
  const currentLevel = character?.level ?? 1;
  const xpForNextLevel = currentLevel * 100;
  const xpForCurrentLevel = (currentLevel - 1) * 100;
  const xpProgress = Math.min(
    ((currentXp - xpForCurrentLevel) / (xpForNextLevel - xpForCurrentLevel)) * 100,
    100
  );

  const CLASS_AVATARS: Record<string, string> = { wizard: "🧙", warrior: "⚔️", archer: "🏹", priest: "🙏" };
  const avatarEmoji = CLASS_AVATARS[character?.class ?? "wizard"] ?? "🧙";
  const avatarScale = 1 + sessionProgress * 0.15;

  if (!selectedCharacterId || !character) {
    return (
      <div className="min-h-screen bg-gradient-premium p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-12">
            <h1 className="text-premium-title">나의 캐릭터</h1>
            <Button onClick={() => logout()} variant="outline" className="btn-premium-outline">
              <LogOut className="w-4 h-4 mr-2" />
              로그아웃
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {characters.map((char: any) => (
              <div
                key={char.id}
                className="card-premium-hover p-6 group relative"
              >
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm(`${char.name} 캐릭터를 삭제하시겠습니까?`)) {
                      deleteCharacterMutation.mutate({ characterId: char.id });
                    }
                  }}
                  className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity bg-red-500/80 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-semibold"
                >
                  삭제
                </button>
                <div
                  onClick={() => setSelectedCharacterId(char.id)}
                  className="cursor-pointer"
                >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-white group-hover:text-purple-300 transition-colors">{char.name}</h3>
                    <p className="text-purple-300">{CLASSES.find(c => c.name === char.class)?.label}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-semibold">Lv. {char.level}</p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">경험치</span>
                    <span className="text-white font-semibold">{char.experience} XP</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">골드</span>
                    <span className="text-yellow-400 font-semibold">{char.gold}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-purple-300">체력</span>
                    <span className="text-red-400 font-semibold">{char.health}/{char.maxHealth}</span>
                  </div>
                </div>
                </div>
              </div>
            ))}
          </div>

          {!showCreation ? (
            <Button onClick={() => setShowCreation(true)} className="btn-premium">
              새 캐릭터 생성
            </Button>
          ) : (
            <Card className="card-premium p-8">
              <h2 className="text-2xl font-bold text-white mb-6">캐릭터 생성</h2>
              <div className="space-y-6">
                <div>
                  <label className="text-premium-label block mb-2">캐릭터 이름</label>
                  <Input
                    placeholder="캐릭터 이름을 입력하세요"
                    value={characterName}
                    onChange={(e) => setCharacterName(e.target.value)}
                    className="bg-purple-900/30 border-purple-500/30 text-white"
                  />
                </div>
                <div>
                  <label className="text-premium-label block mb-3">클래스 선택</label>
                  <div className="grid grid-cols-2 gap-3">
                    {CLASSES.map(cls => {
                      const IconComponent = cls.icon;
                      return (
                        <button
                          key={cls.name}
                          onClick={() => setSelectedClass(cls.name)}
                          className={`p-4 rounded-lg border-2 transition-all ${
                            selectedClass === cls.name
                              ? "border-purple-500 bg-purple-500/20"
                              : "border-purple-500/30 bg-purple-900/20 hover:border-purple-500/60"
                          }`}
                        >
                          <IconComponent className="w-6 h-6 mx-auto mb-2 text-purple-300" />
                          <p className="text-white font-semibold text-sm">{cls.label}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div>
                  <label className="text-premium-label block mb-3">난이도 선택</label>
                  <div className="grid grid-cols-3 gap-3">
                    {DIFFICULTIES.map(diff => (
                      <button
                        key={diff.value}
                        onClick={() => setSelectedDifficulty(diff.value)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedDifficulty === diff.value
                            ? "border-purple-500 bg-purple-500/20"
                            : "border-purple-500/30 bg-purple-900/20 hover:border-purple-500/60"
                        }`}
                      >
                        <p className="text-white font-semibold text-sm">{diff.label}</p>
                        <p className="text-purple-300 text-xs">{diff.multiplier}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={() => createCharacterMutation.mutate({
                      name: characterName,
                      class: selectedClass as any,
                      difficulty: selectedDifficulty as any,
                    })}
                    className="flex-1 btn-premium"
                  >
                    생성
                  </Button>
                  <Button
                    onClick={() => setShowCreation(false)}
                    className="flex-1 btn-premium-outline"
                  >
                    취소
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-premium p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 animate-slide-up">
          <div>
            <p className="text-purple-400 text-sm font-semibold uppercase tracking-widest mb-1">
              {CLASSES.find(c => c.name === character.class)?.label}
            </p>
            <h1 className="text-premium-title">{character.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                Lv. {character.level}
              </span>
              <span className="text-purple-300 text-sm">{character.totalSessions}세션 완료</span>
            </div>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={() => setSelectedCharacterId(null)}
              className="btn-premium-outline"
            >
              다른 캐릭터
            </Button>
            <Button
              onClick={() => logout()}
              variant="outline"
              className="btn-premium-outline"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8 animate-slide-up">
          <div className="stat-box-enhanced col-span-2 md:col-span-1">
            <div className="stat-label flex items-center justify-center gap-1 mb-2">❤️ 체력</div>
            <div className="text-sm font-bold text-white mb-1">{character.health} / {character.maxHealth}</div>
            <div className="progress-premium">
              <div
                className="progress-premium-fill"
                style={{
                  width: `${(character.health / character.maxHealth) * 100}%`,
                  background: "linear-gradient(to right, rgb(239,68,68), rgb(251,113,133))",
                }}
              />
            </div>
          </div>
          <div className="stat-box-enhanced col-span-2 md:col-span-1">
            <div className="stat-label flex items-center justify-center gap-1 mb-2">✨ 경험치</div>
            <div className="text-sm font-bold text-white mb-1">{currentXp} XP</div>
            <div className="progress-premium">
              <div className="progress-premium-fill" style={{ width: `${xpProgress}%` }} />
            </div>
          </div>
          <div className="stat-box-enhanced">
            <div className="stat-label">💰 골드</div>
            <div className="stat-value text-yellow-400">{character.gold}</div>
          </div>
          <div className="stat-box-enhanced">
            <div className="stat-label">⚔️ 공격력</div>
            <div className="stat-value text-red-400">{Number(character.attackPower).toFixed(1)}</div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2 animate-slide-up">
          {["game", "shop", "quests", "achievements", "leaderboard"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-4 py-2 rounded-lg font-semibold transition-all whitespace-nowrap ${
                activeTab === tab
                  ? "bg-gradient-accent text-white shadow-premium"
                  : "btn-premium-outline"
              }`}
            >
              {tab === "game" && "게임"}
              {tab === "shop" && "상점"}
              {tab === "quests" && "퀘스트"}
              {tab === "achievements" && "업적"}
              {tab === "leaderboard" && "랭킹"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="animate-scale-in">
          {activeTab === "game" && (
            <Card className={timerActive ? "card-timer-active p-8" : "card-premium p-8"}>
              <div className="text-center space-y-6">

                {/* Character Avatar with growth effects */}
                <div className="flex flex-col items-center">
                  <div
                    className="relative inline-flex items-center justify-center"
                    style={{ width: 128, height: 128 }}
                  >
                    {timerActive && (
                      <div className="orbit-ring">
                        <div className="orbit-dot" />
                      </div>
                    )}
                    {timerActive && (
                      <>
                        <span className="particle" style={{ left: "20%", animationDelay: "0s",   animationDuration: "1.8s" }} />
                        <span className="particle" style={{ left: "50%", animationDelay: "0.5s", animationDuration: "2.2s" }} />
                        <span className="particle" style={{ left: "70%", animationDelay: "1.0s", animationDuration: "1.6s" }} />
                        <span className="particle" style={{ left: "35%", animationDelay: "1.4s", animationDuration: "2.0s" }} />
                      </>
                    )}
                    <div
                      className={timerActive ? "avatar-active" : "avatar-idle"}
                      style={{
                        fontSize: "5rem",
                        lineHeight: 1,
                        transform: `scale(${avatarScale})`,
                        transition: "transform 1s ease-out",
                      }}
                    >
                      {avatarEmoji}
                    </div>
                  </div>

                  {/* Session energy bar */}
                  <div className="mt-5 w-48">
                    <div className="flex justify-between text-xs text-purple-300 mb-1">
                      <span>세션 에너지</span>
                      <span>{Math.round(sessionProgress * 100)}%</span>
                    </div>
                    <div className="power-bar-track">
                      <div className="power-bar-fill" style={{ width: `${sessionProgress * 100}%` }} />
                    </div>
                  </div>
                </div>

                {/* Circular timer ring */}
                <div className="flex justify-center">
                  <div className="relative" style={{ width: 220, height: 220 }}>
                    <svg
                      width="220"
                      height="220"
                      viewBox="0 0 220 220"
                      style={{ transform: "rotate(-90deg)" }}
                    >
                      <circle
                        cx="110" cy="110" r={RING_RADIUS}
                        fill="none"
                        stroke="rgba(88,28,135,0.4)"
                        strokeWidth="12"
                      />
                      <defs>
                        <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%"   stopColor="rgb(168,85,247)" />
                          <stop offset="100%" stopColor="rgb(236,72,153)" />
                        </linearGradient>
                      </defs>
                      <circle
                        cx="110" cy="110" r={RING_RADIUS}
                        fill="none"
                        stroke="url(#ringGradient)"
                        strokeWidth="12"
                        strokeLinecap="round"
                        strokeDasharray={RING_CIRCUMFERENCE}
                        strokeDashoffset={ringOffset}
                        style={{ transition: "stroke-dashoffset 1s linear" }}
                      />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-bold text-gradient">
                        {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
                      </span>
                      <span className="text-purple-300 text-sm mt-1">집중 시간</span>
                    </div>
                  </div>
                </div>

                {/* Battle scene — visible only while timer is active */}
                {timerActive && (
                  <div className="flex items-center justify-center gap-6 py-1">
                    <div className="relative">
                      <span className="battle-char">{avatarEmoji}</span>
                    </div>
                    <span className="battle-slash">⚡</span>
                    <div className="relative">
                      <span className="battle-monster">👹</span>
                      <span className="battle-dmg">CRIT!</span>
                    </div>
                  </div>
                )}

                {/* XP preview + level bar */}
                <div className="w-full max-w-xs mx-auto space-y-3">
                  <div className={`flex items-center justify-center gap-2 ${timerActive ? "xp-preview-active" : ""}`}>
                    <span className="text-2xl font-bold text-gradient">+{xpPreview} XP</span>
                    <span className="text-purple-400 text-sm">완료 시 획득</span>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs text-purple-300 mb-1">
                      <span>Lv. {currentLevel} 경험치</span>
                      <span>{currentXp} / {xpForNextLevel} XP</span>
                    </div>
                    <div className="progress-premium">
                      <div className="progress-premium-fill" style={{ width: `${xpProgress}%` }} />
                    </div>
                    {timerActive && (
                      <p className="text-xs text-purple-400 text-right mt-1">
                        완료 후: {Math.min(currentXp + xpPreview, xpForNextLevel)} / {xpForNextLevel} XP
                      </p>
                    )}
                  </div>
                  {timerActive && (
                    <p
                      className="text-sm text-purple-300 italic text-center"
                      style={{ animation: "motiv-fade 3s ease-in-out infinite" }}
                    >
                      "당신도 성장중이라는 거 잊지 마세요!"
                    </p>
                  )}
                </div>

                {/* Start / Pause button */}
                <Button
                  onClick={() => setTimerActive(!timerActive)}
                  className={`w-full py-6 text-lg font-semibold ${
                    timerActive ? "bg-red-600 hover:bg-red-700" : "btn-premium"
                  }`}
                >
                  {timerActive ? "⏸ 일시정지" : "▶ 시작"}
                </Button>
              </div>

              {/* Bosses */}
              {bosseQuery.data && bosseQuery.data.length > 0 && (
                <div className="mt-8 pt-8 border-t border-purple-500/30">
                  <h3 className="text-2xl font-bold text-white mb-4">보스 전투</h3>
                  <div className="space-y-3">
                    {bosseQuery.data.map((boss: any) => (
                      <div key={boss.id} className="card-premium p-4 flex justify-between items-center">
                        <div>
                          <h4 className="text-white font-bold">{boss.name}</h4>
                          <div className="progress-premium mt-2">
                            <div
                              className="progress-premium-fill"
                              style={{ width: `${(boss.health / boss.maxHealth) * 100}%` }}
                            />
                          </div>
                          <p className="text-purple-300 text-sm mt-1">{boss.health}/{boss.maxHealth}</p>
                        </div>
                        <Button
                          onClick={() => attackBossMutation.mutate({ characterId: character.id, bossId: boss.id })}
                          disabled={boss.defeated === 1}
                          className={boss.defeated === 1 ? "btn-premium-outline" : "btn-premium"}
                        >
                          {boss.defeated === 1 ? "격파됨" : "공격"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </Card>
          )}

          {activeTab === "shop" && (
            <Card className="card-premium p-8">
              <h3 className="text-2xl font-bold text-white mb-6">장비 상점</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {equipmentQuery.data?.map((item: any) => (
                  <div key={item.id} className="card-premium p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-bold">{item.name}</h4>
                        <p className="text-purple-300 text-sm">{item.type}</p>
                      </div>
                      <span className="text-yellow-400 font-bold">{item.price}</span>
                    </div>
                    <div className="text-sm text-purple-200 mb-3 space-y-1">
                      {item.attackBonus > 0 && <div>공격력 +{item.attackBonus}</div>}
                      {item.defenseBonus > 0 && <div>방어력 +{item.defenseBonus}</div>}
                      {item.healthBonus > 0 && <div>체력 +{item.healthBonus}</div>}
                    </div>
                    <Button
                      onClick={() => buyEquipmentMutation.mutate({ characterId: character.id, equipmentId: item.id })}
                      disabled={item.equipped === 1 || character.gold < item.price}
                      className="w-full btn-premium text-sm"
                    >
                      {item.equipped === 1 ? "장착됨" : character.gold < item.price ? "골드 부족" : "구매"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "quests" && (
            <Card className="card-premium p-8">
              <h3 className="text-2xl font-bold text-white mb-6">일일 퀘스트</h3>
              <div className="space-y-3">
                {questsQuery.data?.map((quest: any) => (
                  <div key={quest.id} className="card-premium p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="text-white font-bold">{quest.title}</h4>
                        <p className="text-purple-300 text-sm">{quest.description}</p>
                      </div>
                      <span className="text-yellow-400 font-bold">{quest.reward}</span>
                    </div>
                    <Button
                      onClick={() => completeQuestMutation.mutate({ characterId: character.id, questId: quest.id })}
                      disabled={quest.completed === 1}
                      className="w-full btn-premium text-sm"
                    >
                      {quest.completed === 1 ? "완료됨" : "완료"}
                    </Button>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "achievements" && (
            <Card className="card-premium p-8">
              <h3 className="text-2xl font-bold text-white mb-6">업적</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievementsQuery.data?.map((ach: any) => (
                  <div key={ach.id} className="card-premium p-4">
                    <div className="flex gap-3">
                      <Trophy className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                      <div>
                        <h4 className="text-white font-bold">{ach.title}</h4>
                        <p className="text-purple-300 text-sm">{ach.description}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {activeTab === "leaderboard" && (
            <Card className="card-premium p-8">
              <h3 className="text-2xl font-bold text-white mb-6">전체 랭킹</h3>
              <div className="space-y-2">
                {leaderboardQuery.data?.map((player: any, idx: number) => (
                  <div key={player.id} className="card-premium p-4 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <span className="text-2xl font-bold text-yellow-400 min-w-12">#{idx + 1}</span>
                      <div>
                        <h4 className="text-white font-bold">{player.name}</h4>
                        <p className="text-purple-300 text-sm">Lv. {player.level}</p>
                      </div>
                    </div>
                    <span className="text-yellow-400 font-bold">{player.experience} XP</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
