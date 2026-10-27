"use client";

import {
  Activity, Award, Bookmark, Bot, Camera, Check, ChefHat, ChevronDown, ChevronRight,
  CircleUserRound, Compass, Dumbbell, Flame, Gauge, Home, ImagePlus, Leaf, LoaderCircle,
  LogOut, MessageCircle, Moon, MoreHorizontal, Pencil, Plus, Search, Send,
  Settings, Share2, Sparkles, Sun, Target, TrendingUp, Trophy, Utensils, X,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { dailyTrend, demoPosts, demoUsers } from "../lib/demo-data";
import type { Nutrition, ValePost, ValeUser } from "../lib/types";

type View = "feed" | "explore" | "log" | "progress" | "profile";
type Viewer = { id: string; name: string; email: string };

const navItems: { id: View; label: string; icon: typeof Home }[] = [
  { id: "feed", label: "Home", icon: Home },
  { id: "explore", label: "Explore", icon: Compass },
  { id: "log", label: "Food log", icon: Utensils },
  { id: "progress", label: "Progress", icon: TrendingUp },
  { id: "profile", label: "Profile", icon: CircleUserRound },
];

export default function ValeApp({ viewer }: { viewer: Viewer }) {
  const [view, setView] = useState<View>("feed");
  const [posts, setPosts] = useState<ValePost[]>(demoPosts);
  const [createOpen, setCreateOpen] = useState(false);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState("");
  const [loggedMeals, setLoggedMeals] = useState<ValePost[]>([]);
  const [following, setFollowing] = useState(() => new Set<string>(["maya"]));

  useEffect(() => {
    fetch("/api/feed").then((res) => res.json()).then((data) => {
      if (data.posts?.length) setPosts(data.posts);
    }).catch(() => undefined);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);

  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  };

  const socialAction = async (postId: string, action: "like" | "bookmark" | "log", post?: ValePost) => {
    if (action === "like") setPosts((items) => items.map((item) => item.id === postId ? { ...item, liked: !item.liked, likes: item.likes + (item.liked ? -1 : 1) } : item));
    if (action === "bookmark") {
      setPosts((items) => items.map((item) => item.id === postId ? { ...item, bookmarked: !item.bookmarked } : item));
      notify(post?.bookmarked ? "Removed from saved" : "Saved for later");
    }
    if (action === "log" && post) {
      setLoggedMeals((items) => items.some((item) => item.id === post.id) ? items : [...items, post]);
      notify("Added to today’s food log");
    }
    fetch("/api/social", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action, postId }) }).catch(() => undefined);
  };

  const comment = (postId: string, body: string) => {
    const clean = body.trim();
    if (!clean) return;
    setPosts((items) => items.map((post) => post.id === postId ? {
      ...post, comments: [...post.comments, { id: crypto.randomUUID(), username: viewer.name.toLowerCase().replace(/\s/g, "."), body: clean }],
    } : post));
    fetch("/api/social", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ action: "comment", postId, body: clean }) }).catch(() => undefined);
  };

  const addCreatedPost = (post: ValePost) => {
    setPosts((items) => [post, ...items]);
    setView("feed");
    notify("Your meal is live");
  };

  const currentUser: ValeUser = {
    id: viewer.id, username: viewer.email.split("@")[0], displayName: viewer.name,
    initials: viewer.name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(),
    avatarGradient: "lime", goal: "Build consistency",
  };

  return (
    <div className="vale-shell">
      <DesktopSidebar view={view} onView={setView} onCreate={() => setCreateOpen(true)} currentUser={currentUser} />
      <div className="mobile-topbar"><Brand /><div className="mobile-top-actions"><button className="icon-button" aria-label="Toggle theme" onClick={() => setDark(!dark)}>{dark ? <Sun size={19} /> : <Moon size={19} />}</button><button className="avatar avatar-lime" onClick={() => setSettingsOpen(true)}>{currentUser.initials}</button></div></div>
      <main className="main-canvas">
        <TopBar view={view} search={search} setSearch={setSearch} dark={dark} setDark={setDark} onSettings={() => setSettingsOpen(true)} />
        {view === "feed" && <Feed posts={posts} onAction={socialAction} onComment={comment} onShare={() => notify("Post link copied")} />}
        {view === "explore" && <Explore posts={posts} users={demoUsers} search={search} following={following} setFollowing={setFollowing} onOpenPost={() => setView("feed")} />}
        {view === "log" && <FoodLog posts={loggedMeals} onBrowse={() => setView("feed")} />}
        {view === "progress" && <Progress />}
        {view === "profile" && <Profile user={currentUser} posts={posts.filter((post) => post.user.id === viewer.id)} onCreate={() => setCreateOpen(true)} />}
      </main>
      <RightRail loggedMeals={loggedMeals} following={following} setFollowing={setFollowing} notify={notify} />
      <button className="ai-fab" onClick={() => setAssistantOpen(true)}><Sparkles size={18} /><span>Ask Vale</span></button>
      <MobileNav view={view} onView={setView} onCreate={() => setCreateOpen(true)} />
      {createOpen && <CreatePostModal viewer={currentUser} onClose={() => setCreateOpen(false)} onCreated={addCreatedPost} />}
      {assistantOpen && <AssistantDrawer onClose={() => setAssistantOpen(false)} />}
      {settingsOpen && <SettingsModal dark={dark} setDark={setDark} viewer={viewer} onClose={() => setSettingsOpen(false)} notify={notify} />}
      {toast && <div className="toast"><Check size={16} />{toast}</div>}
    </div>
  );
}

function Brand() { return <button className="brand" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="VALE home"><span className="brand-mark"><span /></span><span className="brand-word">VALE</span></button>; }

function DesktopSidebar({ view, onView, onCreate, currentUser }: { view: View; onView: (v: View) => void; onCreate: () => void; currentUser: ValeUser }) {
  return <aside className="desktop-sidebar"><Brand /><nav className="side-nav" aria-label="Primary">{navItems.map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => onView(item.id)}><item.icon size={21} /><span>{item.label}</span></button>)}</nav><button className="primary-button create-button" onClick={onCreate}><Plus size={19} />Create post</button><div className="sidebar-spacer" /><button className="profile-chip" onClick={() => onView("profile")}><span className="avatar avatar-lime">{currentUser.initials}</span><span><strong>{currentUser.displayName}</strong><small>@{currentUser.username}</small></span><MoreHorizontal size={18} /></button></aside>;
}

function TopBar({ view, search, setSearch, dark, setDark, onSettings }: { view: View; search: string; setSearch: (s: string) => void; dark: boolean; setDark: (d: boolean) => void; onSettings: () => void }) {
  const titles: Record<View, [string, string]> = { feed: ["Good evening", "See what’s cooking in your circle."], explore: ["Explore", "Fresh ideas and people worth following."], log: ["Today’s fuel", "A simple view of what’s helping you move."], progress: ["Your progress", "Trends, consistency, and wins—without the noise."], profile: ["Your space", "Meals, milestones, and the story you’re building."] };
  return <header className="content-header"><div><p className="eyebrow">Sunday, 25 October</p><h1>{titles[view][0]}</h1><p>{titles[view][1]}</p></div><div className="header-actions"><label className="search-field"><Search size={17} /><input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search meals, people…" /></label><button className="icon-button desktop-only" onClick={() => setDark(!dark)} aria-label="Toggle theme">{dark ? <Sun size={19} /> : <Moon size={19} />}</button><button className="icon-button desktop-only" onClick={onSettings} aria-label="Settings"><Settings size={19} /></button></div></header>;
}

function Feed({ posts, onAction, onComment, onShare }: { posts: ValePost[]; onAction: (id: string, action: "like" | "bookmark" | "log", post?: ValePost) => void; onComment: (id: string, body: string) => void; onShare: () => void }) {
  return <div className="feed-column">
    <section className="fuel-ribbon">
      <span className="fuel-icon"><Gauge size={21} /></span>
      <div><small>TODAY’S FUEL SIGNAL</small><strong>Steady energy, room for dinner.</strong></div>
      <div className="fuel-macro"><i className="protein" /><span><b>78</b>/140g P</span></div>
      <div className="fuel-macro"><i className="carbs" /><span><b>126</b>/260g C</span></div>
      <div className="fuel-macro"><i className="fat" /><span><b>42</b>/73g F</span></div>
    </section>
    <Stories />
    <div className="feed-filter"><div><button className="active">My circle</button><button>Kitchen lab</button></div><button className="filter-button"><span className="load-dots"><i /><i /><i /></span> Meal load <ChevronDown size={14} /></button></div>
    {posts.map((post) => <PostCard key={post.id} post={post} onAction={onAction} onComment={onComment} onShare={onShare} />)}
  </div>;
}

function Stories() { return <div className="stories" aria-label="Stories"><button className="story"><span className="story-add"><Plus size={18} /></span><small>Your story</small></button>{demoUsers.map((user, index) => <button className="story" key={user.id}><span className={`story-ring ${index > 2 ? "seen" : ""}`}><span className={`avatar avatar-${user.avatarGradient}`}>{user.initials}</span></span><small>{user.displayName.split(" ")[0]}</small></button>)}</div>; }

function PostCard({ post, onAction, onComment, onShare }: { post: ValePost; onAction: (id: string, action: "like" | "bookmark" | "log", post?: ValePost) => void; onComment: (id: string, body: string) => void; onShare: () => void }) {
  const [nutritionOpen, setNutritionOpen] = useState(false); const [commentOpen, setCommentOpen] = useState(false); const [commentText, setCommentText] = useState("");
  const load = mealLoad(post.calories);
  const submitComment = (event: React.FormEvent) => { event.preventDefault(); onComment(post.id, commentText); setCommentText(""); setCommentOpen(true); };
  const share = async () => { try { await navigator.clipboard.writeText(`${window.location.origin}/?post=${post.id}`); } catch {} onShare(); };
  return <article className="post-card"><header className="post-header"><button className={`avatar avatar-${post.user.avatarGradient}`}>{post.user.initials}</button><div><button className="user-name">{post.user.displayName}</button><p>@{post.user.username} · {post.createdAt}</p></div><span className="goal-tag">{post.user.goal}</span><button className="icon-button ghost"><MoreHorizontal size={20} /></button></header><div className="post-photo-wrap"><img src={post.imageUrl} alt={post.mealName} className="post-photo" /><div className={`meal-load-label load-${load.tone}`}><i />{load.label}</div><button className={`calorie-orb load-${load.tone} ${nutritionOpen ? "open" : ""}`} onClick={() => setNutritionOpen(!nutritionOpen)} aria-expanded={nutritionOpen} aria-label={`${post.calories} calories, ${load.label} meal`}><span><strong>{post.calories}</strong><small>kcal</small></span><Sparkles size={13} /></button>{nutritionOpen && <div className="nutrition-popover"><div><span><Sparkles size={13} /> AI estimate · {load.label}</span><button><Pencil size={13} /> Correct</button></div><h3>{post.mealName}</h3><div className="macro-grid"><Macro value={`${post.protein}g`} label="Protein" tone="green" /><Macro value={`${post.carbs}g`} label="Carbs" tone="gold" /><Macro value={`${post.fat}g`} label="Fat" tone="pink" /></div><p>Estimates can vary. Tap correct to fine-tune your log.</p></div>}</div><div className="post-body"><div className="post-actions"><button className={`kudos ${post.liked ? "liked" : ""}`} onClick={() => onAction(post.id, "like", post)} aria-label="Give meal kudos" title="Give kudos"><ChefHat size={22} /><span>{post.likes}</span><em>Kudos</em></button><button onClick={() => setCommentOpen(!commentOpen)} aria-label="Comment"><MessageCircle size={22} /><span>{post.comments.length}</span></button><button onClick={share} aria-label="Share"><Share2 size={21} /></button><button className="log-meal" onClick={() => onAction(post.id, "log", post)}><Plus size={15} /> Log meal</button><button className={`bookmark ${post.bookmarked ? "saved" : ""}`} onClick={() => onAction(post.id, "bookmark", post)} aria-label="Bookmark"><Bookmark size={22} fill={post.bookmarked ? "currentColor" : "none"} /></button></div><h2>{post.mealName}</h2><p className="caption">{post.caption}</p>{post.comments.slice(-2).map((comment) => <p className="comment" key={comment.id}><strong>@{comment.username}</strong> {comment.body}</p>)}<button className="view-comments" onClick={() => setCommentOpen(!commentOpen)}>{commentOpen ? "Hide comments" : post.comments.length ? `View all ${post.comments.length} comments` : "Start the conversation"}</button>{commentOpen && <form className="comment-form" onSubmit={submitComment}><input value={commentText} onChange={(e) => setCommentText(e.target.value)} placeholder="Add something kind…" maxLength={280} /><button aria-label="Post comment"><Send size={17} /></button></form>}</div></article>;
}

function Macro({ value, label, tone }: { value: string; label: string; tone: string }) { return <div className={`macro macro-${tone}`}><i /><strong>{value}</strong><span>{label}</span></div>; }

function mealLoad(calories: number) {
  if (calories < 500) return { tone: "light", label: "Light fuel" };
  if (calories <= 700) return { tone: "steady", label: "Steady fuel" };
  return { tone: "hearty", label: "Hearty fuel" };
}

function Explore({ posts, users, search, following, setFollowing, onOpenPost }: { posts: ValePost[]; users: ValeUser[]; search: string; following: Set<string>; setFollowing: React.Dispatch<React.SetStateAction<Set<string>>>; onOpenPost: () => void }) {
  const query = search.toLowerCase(); const filteredPosts = posts.filter((post) => `${post.mealName} ${post.caption} ${post.user.username}`.toLowerCase().includes(query)); const toggle = (id: string) => setFollowing((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next; });
  return <div className="page-stack"><section className="discover-hero"><div><span className="eyebrow">Community pulse</span><h2>Eat well, together.</h2><p>Discover meals from people with goals like yours.</p></div><div className="pulse-stat"><strong>12.8k</strong><span>meals shared this week</span></div></section><section><div className="section-heading"><div><p className="eyebrow">People</p><h2>Find your circle</h2></div><button>See all <ChevronRight size={16} /></button></div><div className="people-row">{users.filter((u) => `${u.displayName} ${u.username}`.toLowerCase().includes(query)).map((user) => <div className="person-card" key={user.id}><span className={`avatar avatar-${user.avatarGradient}`}>{user.initials}</span><strong>{user.displayName}</strong><span>@{user.username}</span><small>{user.mutuals} mutuals · {user.goal}</small><button className={following.has(user.id) ? "following" : ""} onClick={() => toggle(user.id)}>{following.has(user.id) ? <><Check size={14} /> Following</> : <><Plus size={14} /> Follow</>}</button></div>)}</div></section><section><div className="section-heading"><div><p className="eyebrow">Trending plates</p><h2>Made to inspire</h2></div></div>{filteredPosts.length ? <div className="explore-grid">{filteredPosts.map((post) => { const load = mealLoad(post.calories); return <button key={post.id} className="explore-tile" onClick={onOpenPost}><img src={post.imageUrl} alt={post.mealName} /><span className={`tile-macros load-${load.tone}`}><i /> <strong>{post.calories}</strong> kcal</span><span className="tile-caption"><strong>{post.mealName}</strong><small>@{post.user.username}</small></span></button>; })}</div> : <EmptyState icon={Search} title="No meals found" copy="Try a broader ingredient or creator name." />}</section></div>;
}

function FoodLog({ posts, onBrowse }: { posts: ValePost[]; onBrowse: () => void }) {
  const totals = posts.reduce((sum, post) => ({ calories: sum.calories + post.calories, protein: sum.protein + post.protein, carbs: sum.carbs + post.carbs, fat: sum.fat + post.fat }), { calories: 1160, protein: 78, carbs: 126, fat: 42 });
  return <div className="page-stack"><section className="summary-card"><div className="calorie-ring large" style={{ "--progress": `${Math.min(100, totals.calories / 22)}%` } as React.CSSProperties}><span><strong>{totals.calories.toLocaleString()}</strong><small>of 2,200 kcal</small></span></div><div className="summary-copy"><span className="status-pill"><span /> On track</span><h2>{Math.max(0, 2200 - totals.calories)} calories left</h2><p>Your targets flex with your maintenance goal and recent activity.</p><div className="macro-bars"><MacroBar label="Protein" value={totals.protein} target={140} tone="green" /><MacroBar label="Carbs" value={totals.carbs} target={260} tone="gold" /><MacroBar label="Fat" value={totals.fat} target={73} tone="pink" /></div></div></section><section><div className="section-heading"><div><p className="eyebrow">Sunday, 25 October</p><h2>Meals</h2></div><button className="secondary-button" onClick={onBrowse}><Plus size={16} /> From feed</button></div><div className="meal-list"><MealRow time="8:10" name="Greek yoghurt, berries & honey" calories={380} /><MealRow time="12:45" name="Turkey avocado sourdough" calories={542} /><MealRow time="16:20" name="Flat white & banana" calories={238} />{posts.map((post) => <MealRow key={post.id} time="Now" name={post.mealName} calories={post.calories} image={post.imageUrl} />)}</div></section></div>;
}

function MacroBar({ label, value, target, tone }: { label: string; value: number; target: number; tone: string }) { return <div><p><span>{label}</span><strong>{value}g <small>/ {target}g</small></strong></p><span className="bar"><i className={`bar-${tone}`} style={{ width: `${Math.min(100, value / target * 100)}%` }} /></span></div>; }
function MealRow({ time, name, calories, image }: { time: string; name: string; calories: number; image?: string }) { return <div className="meal-row"><span className="meal-time">{time}</span>{image ? <img src={image} alt="" /> : <span className="meal-icon"><Utensils size={18} /></span>}<div><strong>{name}</strong><span>Estimated nutrition · Editable</span></div><b>{calories} kcal</b><button className="icon-button ghost"><MoreHorizontal size={18} /></button></div>; }

function Progress() {
  const [range, setRange] = useState("7D"); const points = dailyTrend.map((value, i) => `${i * 16.66},${88 - ((value - 1400) / 1000) * 68}`).join(" ");
  return <div className="page-stack">
    <div className="stat-grid"><StatCard icon={Flame} value="12" label="day streak" note="Personal best: 19" tone="lime" /><StatCard icon={Target} value="86%" label="goal consistency" note="+8% this month" tone="rose" /><StatCard icon={Dumbbell} value="7.4k" label="avg. daily steps" note="Health sync soon" tone="blue" /></div>
    <section className="chart-card nutrition-story">
      <div className="section-heading"><div><p className="eyebrow">Fuel pattern</p><h2>Calories + macro goals</h2></div><div className="range-switch">{["7D", "1M", "3M"].map((item) => <button key={item} className={range === item ? "active" : ""} onClick={() => setRange(item)}>{item}</button>)}</div></div>
      <div className="chart-wrap"><div className="chart-labels"><span>2,400</span><span>2,000</span><span>1,600</span></div><svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-label="Calorie intake graph"><defs><linearGradient id="area" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#a9dc45" stopOpacity=".45"/><stop offset="1" stopColor="#a9dc45" stopOpacity="0"/></linearGradient></defs><line x1="0" y1="36" x2="100" y2="36" className="goal-line"/><polygon points={`0,100 ${points} 100,100`} fill="url(#area)"/><polyline points={points} fill="none" className="trend-line" vectorEffect="non-scaling-stroke"/></svg><span className="calorie-goal-tag">Goal · 2,200 kcal</span><div className="days">{["MON","TUE","WED","THU","FRI","SAT","SUN"].map((d) => <span key={d}>{d}</span>)}</div></div>
      <div className="macro-goal-diagram">
        <div className="macro-goal-copy"><span><Leaf size={18} /> Daily balance</span><strong>Macros are landing<br/>inside your goal zone.</strong><p>Seven-day average compared with your personalised maintenance targets.</p></div>
        <MacroGoalDial label="Protein" value={128} target={140} tone="protein" />
        <MacroGoalDial label="Carbs" value={232} target={260} tone="carbs" />
        <MacroGoalDial label="Fat" value={68} target={73} tone="fat" />
      </div>
    </section>
    <section><div className="section-heading"><div><p className="eyebrow">Recently earned</p><h2>Milestones</h2></div><button><Share2 size={15} /> Share progress</button></div><div className="achievement-row"><Achievement icon={Flame} title="10-day flame" copy="Tracked consistently for ten days" /><Achievement icon={Utensils} title="Home cook" copy="Shared 25 homemade meals" /><Achievement icon={Award} title="Protein pro" copy="Hit your protein target 7×" /></div></section>
  </div>;
}

function MacroGoalDial({ label, value, target, tone }: { label: string; value: number; target: number; tone: string }) {
  const percent = Math.min(100, Math.round(value / target * 100));
  return <div className={`macro-goal macro-goal-${tone}`}><div className="macro-dial" style={{ "--macro-progress": `${percent}%` } as React.CSSProperties}><span><strong>{percent}%</strong><small>of goal</small></span></div><div><strong>{label}</strong><span>{value}g <small>/ {target}g</small></span></div></div>;
}
function StatCard({ icon: Icon, value, label, note, tone }: { icon: typeof Flame; value: string; label: string; note: string; tone: string }) { return <div className={`stat-card tone-${tone}`}><span><Icon size={20} /></span><strong>{value}</strong><p>{label}</p><small>{note}</small></div>; }
function Achievement({ icon: Icon, title, copy }: { icon: typeof Flame; title: string; copy: string }) { return <div className="achievement"><span><Icon size={24} /></span><div><strong>{title}</strong><p>{copy}</p></div><ChevronRight size={18} /></div>; }

function Profile({ user, posts, onCreate }: { user: ValeUser; posts: ValePost[]; onCreate: () => void }) { return <div className="page-stack"><section className="profile-hero"><div className="profile-cover"><span>Small choices.<br/><em>Strong days.</em></span></div><div className="profile-details"><span className={`avatar avatar-${user.avatarGradient}`}>{user.initials}</span><button className="secondary-button"><Pencil size={15} /> Edit profile</button><h2>{user.displayName}</h2><p>@{user.username}</p><p className="bio">Finding the sweet spot between good food, strong lifts, and a life well lived.</p><div className="profile-counts"><span><strong>28</strong> posts</span><span><strong>642</strong> followers</span><span><strong>388</strong> following</span></div></div></section><div className="profile-tabs"><button className="active">Posts</button><button>Saved</button><button>Milestones</button></div>{posts.length ? <div className="explore-grid">{posts.map((post) => <div className="explore-tile" key={post.id}><img src={post.imageUrl} alt={post.mealName} /></div>)}</div> : <EmptyState icon={Camera} title="Your first plate belongs here" copy="Share something delicious and let VALE estimate the nutrition." action="Create a post" onAction={onCreate} />}</div>; }

function RightRail({ loggedMeals, following, setFollowing, notify }: { loggedMeals: ValePost[]; following: Set<string>; setFollowing: React.Dispatch<React.SetStateAction<Set<string>>>; notify: (s: string) => void }) {
  const added = loggedMeals.reduce((sum, meal) => sum + meal.calories, 0);
  return <aside className="right-rail"><section className="rail-card today-card"><div className="rail-title"><span><Target size={17} /> Today</span><button>Details</button></div><div className="today-main"><div className="calorie-ring" style={{ "--progress": `${Math.min(100, (1160 + added) / 22)}%` } as React.CSSProperties}><span><strong>{(1160 + added).toLocaleString()}</strong><small>of 2,200</small></span></div><div><strong>{Math.max(0, 1040 - added)}</strong><span>kcal left</span><small><i /> Right on pace</small></div></div><div className="mini-macros"><span><i className="p" /><b>{78 + loggedMeals.reduce((s,p)=>s+p.protein,0)}g</b> protein</span><span><i className="c" /><b>{126 + loggedMeals.reduce((s,p)=>s+p.carbs,0)}g</b> carbs</span><span><i className="f" /><b>{42 + loggedMeals.reduce((s,p)=>s+p.fat,0)}g</b> fat</span></div></section><section className="rail-card streak-card"><div className="streak-icon"><Flame size={23} fill="currentColor" /></div><div><p>Current streak</p><strong>12 days</strong><span>One check-in from a new badge</span></div><button onClick={() => notify("Streak card ready to share")}><Share2 size={17} /></button></section><section className="rail-card challenge-card"><div className="challenge-art"><Trophy size={27} /><span>COMMUNITY CHALLENGE</span></div><h3>7 colours, 7 days</h3><p>Add a different colourful plant to your plate each day.</p><div className="challenge-progress"><span><i style={{ width: "57%" }} /></span><small><strong>4 of 7</strong> days · 2.8k joined</small></div><button onClick={() => notify("Challenge joined—day 5 starts now!")}>Join challenge</button></section><section className="suggestions"><div className="rail-title"><span>People to follow</span><button>See all</button></div>{demoUsers.slice(1,4).map((user) => <div className="suggestion" key={user.id}><span className={`avatar avatar-${user.avatarGradient}`}>{user.initials}</span><div><strong>{user.displayName}</strong><small>@{user.username}</small></div><button onClick={() => setFollowing((current) => { const next = new Set(current); next.add(user.id); return next; })}>{following.has(user.id) ? <Check size={16} /> : <Plus size={16} />}</button></div>)}</section></aside>;
}

function CreatePostModal({ viewer, onClose, onCreated }: { viewer: ValeUser; onClose: () => void; onCreated: (post: ValePost) => void }) {
  const fileInput = useRef<HTMLInputElement>(null); const [file, setFile] = useState<File | null>(null); const [preview, setPreview] = useState(""); const [analyzing, setAnalyzing] = useState(false); const [saving, setSaving] = useState(false); const [mealName, setMealName] = useState(""); const [caption, setCaption] = useState(""); const [nutrition, setNutrition] = useState<Nutrition>({ calories: 548, protein: 34, carbs: 58, fat: 21 });
  useEffect(() => () => { if (preview.startsWith("blob:")) URL.revokeObjectURL(preview); }, [preview]);
  const choose = (selected?: File) => { if (!selected) return; setFile(selected); setPreview(URL.createObjectURL(selected)); setAnalyzing(true); window.setTimeout(() => { setAnalyzing(false); setMealName("Balanced harvest bowl"); }, 1200); };
  const submit = async (event: React.FormEvent) => { event.preventDefault(); if (!file || !mealName.trim()) return; setSaving(true); const form = new FormData(); form.set("image", file); form.set("mealName", mealName); form.set("caption", caption); Object.entries(nutrition).forEach(([key, value]) => form.set(key, String(value))); let imageUrl = preview; try { const response = await fetch("/api/posts", { method: "POST", body: form }); const data = await response.json(); if (response.ok) imageUrl = data.imageUrl; } catch {} onCreated({ id: crypto.randomUUID(), user: viewer, imageUrl, mealName, caption, ...nutrition, aiEstimated: true, createdAt: "now", likes: 0, liked: false, bookmarked: false, comments: [] }); setSaving(false); onClose(); };
  return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal create-modal" role="dialog" aria-modal="true"><header><div><span className="eyebrow">NEW POST</span><h2>Share what’s on your plate</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></header><form onSubmit={submit}><div className="create-grid"><div className={`upload-zone ${preview ? "has-image" : ""}`} onClick={() => fileInput.current?.click()}>{preview ? <img src={preview} alt="Meal preview" /> : <><span><ImagePlus size={28} /></span><strong>Add a meal photo</strong><p>JPG, PNG or WEBP · max 8 MB</p><button type="button" className="secondary-button">Choose photo</button></>}<input ref={fileInput} type="file" accept="image/*" hidden onChange={(e) => choose(e.target.files?.[0])} />{analyzing && <div className="analysis-overlay"><LoaderCircle className="spin" size={24} /><strong>Analysing your meal…</strong><span>Estimating portions and macros</span></div>}</div><div className="post-fields"><label>Meal name<input required value={mealName} onChange={(e) => setMealName(e.target.value)} placeholder="e.g. Sunday grain bowl" /></label><label>Caption<textarea value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Tell your circle about it…" maxLength={800} /></label><div className="estimate-panel"><div><span><Sparkles size={15} /> AI nutrition estimate</span><small>Editable</small></div><label className="calorie-input">Calories<input type="number" value={nutrition.calories} onChange={(e) => setNutrition({ ...nutrition, calories: Number(e.target.value) })} /><span>kcal</span></label><div className="macro-inputs">{(["protein", "carbs", "fat"] as const).map((key) => <label key={key}>{key}<span><input type="number" value={nutrition[key]} onChange={(e) => setNutrition({ ...nutrition, [key]: Number(e.target.value) })} />g</span></label>)}</div><p>VALE estimates from your photo. Check portions and edit anything that looks off.</p></div></div></div><footer><span><Sparkles size={14} /> AI estimate will be labelled on your post</span><button type="submit" className="primary-button" disabled={!file || analyzing || saving}>{saving ? <><LoaderCircle className="spin" size={17} /> Posting…</> : "Share meal"}</button></footer></form></div></div>;
}

function AssistantDrawer({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState([{ from: "ai", text: "Hey! I’m Vale. I can help you make sense of your nutrition without turning food into homework. What are you curious about?" }]); const [input, setInput] = useState("");
  const send = (event: React.FormEvent) => { event.preventDefault(); if (!input.trim()) return; const question = input.trim(); setInput(""); setMessages((m) => [...m, { from: "you", text: question }, { from: "ai", text: "Based on today’s log, you’re pacing well. A protein-forward snack with fruit—like Greek yoghurt and berries—would close the gap while keeping dinner flexible." }]); };
  return <div className="drawer-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><aside className="assistant-drawer"><header><span className="ai-avatar"><Sparkles size={20} /></span><div><strong>Vale AI</strong><small><i /> Ready to help</small></div><button className="icon-button" onClick={onClose}><X size={20} /></button></header><div className="assistant-intro"><span><Bot size={25} /></span><h2>Food clarity, not food rules.</h2><p>Ask about a meal, your daily targets, or what to cook next.</p></div><div className="chat-messages">{messages.map((message, i) => <div key={i} className={`chat ${message.from}`}>{message.text}</div>)}</div><div className="quick-prompts"><button onClick={() => setInput("What should I eat after my run?")}>Post-run meal?</button><button onClick={() => setInput("Am I getting enough protein?")}>Protein check</button></div><form onSubmit={send}><input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask Vale anything…" /><button><Send size={18} /></button></form><small className="assistant-note">Guidance only—not medical advice.</small></aside></div>;
}

function SettingsModal({ dark, setDark, viewer, onClose, notify }: { dark: boolean; setDark: (v: boolean) => void; viewer: Viewer; onClose: () => void; notify: (s: string) => void }) { return <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}><div className="modal settings-modal"><header><div><span className="eyebrow">ACCOUNT</span><h2>Settings & privacy</h2></div><button className="icon-button" onClick={onClose}><X size={20} /></button></header><div className="settings-user"><span className="avatar avatar-lime">{viewer.name.slice(0,2).toUpperCase()}</span><div><strong>{viewer.name}</strong><span>{viewer.email}</span></div></div><div className="settings-list"><button onClick={() => setDark(!dark)}><span>{dark ? <Moon /> : <Sun />}</span><div><strong>Appearance</strong><small>{dark ? "Dark mode" : "Light mode"}</small></div><ChevronRight /></button><button onClick={() => notify("Nutrition remains private by default")}><span><Target /></span><div><strong>Nutrition privacy</strong><small>Only you can see daily totals</small></div><ChevronRight /></button><button onClick={() => notify("Health connections are coming soon")}><span><Activity /></span><div><strong>Health connections</strong><small>Apple Health & Health Connect soon</small></div><ChevronRight /></button></div><a href="/signout-with-chatgpt?return_to=/" target="_top" className="signout"><LogOut size={17} /> Sign out</a></div></div>; }

function MobileNav({ view, onView, onCreate }: { view: View; onView: (v: View) => void; onCreate: () => void }) { return <nav className="mobile-nav">{navItems.slice(0,2).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => onView(item.id)}><item.icon /><span>{item.label}</span></button>)}<button className="mobile-create" onClick={onCreate}><Plus /></button>{navItems.slice(2,4).map((item) => <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => onView(item.id)}><item.icon /><span>{item.label}</span></button>)}</nav>; }
function EmptyState({ icon: Icon, title, copy, action, onAction }: { icon: typeof Search; title: string; copy: string; action?: string; onAction?: () => void }) { return <div className="empty-state"><span><Icon size={26} /></span><h3>{title}</h3><p>{copy}</p>{action && <button className="primary-button" onClick={onAction}>{action}</button>}</div>; }
