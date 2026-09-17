/**
 * High-fidelity HTML5 Canvas Generator Engine
 * Provides instant, zero-lag, offline-resilient graphic generation for Fixio tools
 * when external generator APIs encounter downtime or HTTP 503.
 */

// Helper to load image cleanly
function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image"));
    img.src = src;
  });
}

// 1. Fake Free Fire Duo Lobby Generator
export async function renderFakeFFDuoCanvas(name1: string, name2: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 675;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // Dark fire battle background
  const bgGrad = ctx.createLinearGradient(0, 0, 1200, 675);
  bgGrad.addColorStop(0, "#0a0712");
  bgGrad.addColorStop(0.5, "#170c26");
  bgGrad.addColorStop(1, "#2b0a04");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1200, 675);

  // Fiery ambient glow
  const fireGlow = ctx.createRadialGradient(600, 450, 50, 600, 450, 550);
  fireGlow.addColorStop(0, "rgba(255, 102, 0, 0.4)");
  fireGlow.addColorStop(0.7, "rgba(255, 30, 0, 0.15)");
  fireGlow.addColorStop(1, "transparent");
  ctx.fillStyle = fireGlow;
  ctx.fillRect(0, 0, 1200, 675);

  // Grid / tech pattern overlay
  ctx.strokeStyle = "rgba(255, 255, 255, 0.04)";
  ctx.lineWidth = 1;
  for (let x = 0; x < 1200; x += 40) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 675);
    ctx.stroke();
  }

  // Header Title
  ctx.fillStyle = "#ffaa00";
  ctx.font = "900 36px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FREE FIRE DUO BATTLE", 600, 65);

  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "700 16px sans-serif";
  ctx.fillText("RANKED SEASON DUO TEAM • GRANDMASTER TIER", 600, 95);

  // Player 1 Card (Left)
  drawPlayerCard(ctx, {
    x: 120,
    y: 135,
    width: 440,
    height: 470,
    name: name1 || "Player 1",
    role: "CAPTAIN / RUSHER",
    color: "#ff6a00",
    likes: "9,420",
    level: "Lv. 78",
    avatarBg: "#ff4500",
    badge: "GRANDMASTER",
    avatarIcon: "🔥",
  });

  // VS Icon in Center
  ctx.save();
  ctx.fillStyle = "#ffcc00";
  ctx.font = "900 44px 'Space Grotesk', sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.shadowColor = "#ff5500";
  ctx.shadowBlur = 20;
  ctx.fillText("&", 600, 360);
  ctx.restore();

  // Player 2 Card (Right)
  drawPlayerCard(ctx, {
    x: 640,
    y: 135,
    width: 440,
    height: 470,
    name: name2 || "Player 2",
    role: "SUPPORT / SNIPER",
    color: "#9d4edd",
    likes: "8,150",
    level: "Lv. 74",
    avatarBg: "#7b2cbf",
    badge: "MASTER",
    avatarIcon: "⚡",
  });

  // Footer branding
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "600 14px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FIXIO TOOLS • GENERATED VIA NEXADEV ENGINE", 600, 645);

  return canvas.toDataURL("image/png");
}

// 2. Fake Free Fire Solo Generator
export async function renderFakeFFSoloCanvas(name: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 1000;
  canvas.height = 600;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // Background
  const bgGrad = ctx.createLinearGradient(0, 0, 1000, 600);
  bgGrad.addColorStop(0, "#080b18");
  bgGrad.addColorStop(1, "#1e0b36");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, 1000, 600);

  // Card
  drawPlayerCard(ctx, {
    x: 250,
    y: 65,
    width: 500,
    height: 470,
    name: name || "Solo Player",
    role: "SOLO SURVIVOR • PRO",
    color: "#ffaa00",
    likes: "12,850",
    level: "Lv. 82",
    avatarBg: "#ff6600",
    badge: "GRANDMASTER",
    avatarIcon: "👑",
  });

  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "600 13px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("FREE FIRE PROFILE • FIXIO ENGINE", 500, 575);

  return canvas.toDataURL("image/png");
}

function drawPlayerCard(
  ctx: CanvasRenderingContext2D,
  data: {
    x: number;
    y: number;
    width: number;
    height: number;
    name: string;
    role: string;
    color: string;
    likes: string;
    level: string;
    avatarBg: string;
    badge: string;
    avatarIcon: string;
  }
) {
  const { x, y, width, height, name, role, color, likes, level, avatarBg, badge, avatarIcon } = data;

  // Outer Card Box
  ctx.save();
  ctx.fillStyle = "rgba(20, 15, 35, 0.85)";
  ctx.strokeStyle = color;
  ctx.lineWidth = 2;
  ctx.shadowColor = color;
  ctx.shadowBlur = 15;
  roundRect(ctx, x, y, width, height, 20);
  ctx.fill();
  ctx.stroke();
  ctx.restore();

  // Avatar Circle
  const avatarCenterX = x + width / 2;
  const avatarCenterY = y + 110;
  ctx.save();
  ctx.fillStyle = avatarBg;
  ctx.beginPath();
  ctx.arc(avatarCenterX, avatarCenterY, 55, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Avatar Icon/Emoji
  ctx.font = "50px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(avatarIcon, avatarCenterX, avatarCenterY + 2);
  ctx.restore();

  // Badge Ribbon
  ctx.save();
  ctx.fillStyle = color;
  roundRect(ctx, x + width / 2 - 80, y + 180, 160, 26, 13);
  ctx.fill();
  ctx.fillStyle = "#000000";
  ctx.font = "900 12px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(badge, x + width / 2, y + 193);
  ctx.restore();

  // Player Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "900 28px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText(name, x + width / 2, y + 245);

  // Role
  ctx.fillStyle = color;
  ctx.font = "700 13px sans-serif";
  ctx.fillText(role, x + width / 2, y + 275);

  // Stats Grid Container
  ctx.fillStyle = "rgba(255, 255, 255, 0.05)";
  roundRect(ctx, x + 30, y + 305, width - 60, 120, 14);
  ctx.fill();

  // Stat 1: Level
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "600 12px sans-serif";
  ctx.fillText("ACCOUNT LEVEL", x + width / 4 + 15, y + 338);

  ctx.fillStyle = "#ffffff";
  ctx.font = "900 22px 'Space Grotesk', sans-serif";
  ctx.fillText(level, x + width / 4 + 15, y + 372);

  // Stat 2: Likes
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "600 12px sans-serif";
  ctx.fillText("TOTAL LIKES ❤️", x + (width * 3) / 4 - 15, y + 338);

  ctx.fillStyle = "#ff4d6d";
  ctx.font = "900 22px 'Space Grotesk', sans-serif";
  ctx.fillText(likes, x + (width * 3) / 4 - 15, y + 372);

  // Signature Tag
  ctx.fillStyle = "rgba(255, 255, 255, 0.4)";
  ctx.font = "500 11px monospace";
  ctx.fillText("UID: 284" + Math.floor(100000 + Math.random() * 900000), x + width / 2, y + 405);
}

// 3. WhatsApp Quote Generator (QCWA)
export async function renderQcWaCanvas(
  name: string,
  text: string,
  theme: "dark" | "light" = "dark",
  avatarUrl?: string
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 420;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  const isDark = theme === "dark";
  const bgColor = isDark ? "#0b141a" : "#efeae2";
  const bubbleColor = isDark ? "#202c33" : "#ffffff";
  const textColor = isDark ? "#e9edef" : "#111b21";
  const nameColor = "#00a884";
  const timeColor = isDark ? "#8696a0" : "#667781";

  // Canvas Background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, 800, 420);

  // Chat Bubble
  const bubbleX = 140;
  const bubbleY = 80;
  const bubbleW = 580;
  const bubbleH = 260;

  ctx.fillStyle = bubbleColor;
  roundRect(ctx, bubbleX, bubbleY, bubbleW, bubbleH, 18);
  ctx.fill();

  // Bubble tail
  ctx.beginPath();
  ctx.moveTo(bubbleX, bubbleY + 20);
  ctx.lineTo(bubbleX - 15, bubbleY + 30);
  ctx.lineTo(bubbleX, bubbleY + 40);
  ctx.fill();

  // Avatar (Left side)
  const avatarX = 75;
  const avatarY = 110;
  const avatarR = 38;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.clip();

  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.drawImage(img, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    } catch {
      drawFallbackAvatar(ctx, avatarX, avatarY, avatarR, name);
    }
  } else {
    drawFallbackAvatar(ctx, avatarX, avatarY, avatarR, name);
  }
  ctx.restore();

  // Sender Name + Verified check
  ctx.fillStyle = nameColor;
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText(name || "Nexa", bubbleX + 25, bubbleY + 45);

  // Verified Badge
  ctx.fillStyle = "#00a884";
  ctx.beginPath();
  ctx.arc(bubbleX + 25 + ctx.measureText(name || "Nexa").width + 16, bubbleY + 39, 9, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 11px sans-serif";
  ctx.fillText("✓", bubbleX + 25 + ctx.measureText(name || "Nexa").width + 12, bubbleY + 43);

  // Quote Text
  ctx.fillStyle = textColor;
  ctx.font = "500 22px sans-serif";
  wrapText(ctx, text || "Halo dari NexaDev!", bubbleX + 25, bubbleY + 95, bubbleW - 50, 32);

  // Time & Blue ticks
  const now = new Date();
  const timeStr = `${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  ctx.fillStyle = timeColor;
  ctx.font = "14px sans-serif";
  ctx.fillText(timeStr, bubbleX + bubbleW - 75, bubbleY + bubbleH - 20);

  ctx.fillStyle = "#53bdeb";
  ctx.font = "bold 15px sans-serif";
  ctx.fillText("✓✓", bubbleX + bubbleW - 32, bubbleY + bubbleH - 20);

  return canvas.toDataURL("image/png");
}

// 4. Fake Incoming / Active Call Screen
export async function renderFakeCallCanvas(name: string, duration: string, avatarUrl?: string): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 720;
  canvas.height = 1280;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // Dark backdrop
  ctx.fillStyle = "#0c1017";
  ctx.fillRect(0, 0, 720, 1280);

  // Background glow
  const grad = ctx.createRadialGradient(360, 450, 50, 360, 450, 450);
  grad.addColorStop(0, "#1a2536");
  grad.addColorStop(1, "#0c1017");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 720, 1280);

  // Header Title
  ctx.fillStyle = "rgba(255, 255, 255, 0.6)";
  ctx.font = "600 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("WHATSAPP VOICE CALL", 360, 120);

  // Avatar Center
  const avatarX = 360;
  const avatarY = 380;
  const avatarR = 120;

  ctx.save();
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR, 0, Math.PI * 2);
  ctx.clip();
  if (avatarUrl) {
    try {
      const img = await loadImage(avatarUrl);
      ctx.drawImage(img, avatarX - avatarR, avatarY - avatarR, avatarR * 2, avatarR * 2);
    } catch {
      drawFallbackAvatar(ctx, avatarX, avatarY, avatarR, name);
    }
  } else {
    drawFallbackAvatar(ctx, avatarX, avatarY, avatarR, name);
  }
  ctx.restore();

  // Avatar Border Ring
  ctx.strokeStyle = "rgba(255, 255, 255, 0.15)";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(avatarX, avatarY, avatarR + 3, 0, Math.PI * 2);
  ctx.stroke();

  // Caller Name
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 44px sans-serif";
  ctx.fillText(name || "Sayang ❤️", 360, 580);

  // Call Duration
  ctx.fillStyle = "#25d366";
  ctx.font = "600 24px monospace";
  ctx.fillText(duration || "05:21", 360, 630);

  // Buttons Row (Speaker, Mute, Video, End Call)
  const btnY = 1050;

  // Red End Call Button
  ctx.fillStyle = "#ea4335";
  ctx.beginPath();
  ctx.arc(360, btnY, 48, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = "34px sans-serif";
  ctx.fillText("📞", 360, btnY + 12);

  // Mute button
  ctx.fillStyle = "rgba(255, 255, 255, 0.15)";
  ctx.beginPath();
  ctx.arc(200, btnY, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.font = "24px sans-serif";
  ctx.fillText("🎙️", 200, btnY + 8);

  // Speaker button
  ctx.beginPath();
  ctx.arc(520, btnY, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillText("🔊", 520, btnY + 8);

  return canvas.toDataURL("image/png");
}

// 5. iOS Dark Quote (IQC Dark)
export async function renderIqcDarkCanvas(text: string, time: string = "12:00"): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 800;
  canvas.height = 500;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // Deep iOS OLED Dark
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, 800, 500);

  // Glass card
  ctx.fillStyle = "rgba(28, 28, 30, 0.95)";
  ctx.strokeStyle = "rgba(255, 255, 255, 0.12)";
  ctx.lineWidth = 1;
  roundRect(ctx, 80, 80, 640, 340, 28);
  ctx.fill();
  ctx.stroke();

  // Time & Status Header
  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "600 16px sans-serif";
  ctx.textAlign = "left";
  ctx.fillText("NOTES • " + time, 120, 135);

  // Quote Text
  ctx.fillStyle = "#ffffff";
  ctx.font = "600 28px sans-serif";
  wrapText(ctx, text || "Segala sesuatu yang indah memerlukan waktu dan ketekunan.", 120, 200, 560, 42);

  // Watermark
  ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
  ctx.font = "500 13px sans-serif";
  ctx.textAlign = "right";
  ctx.fillText("Shared from iPhone • Fixio", 680, 380);

  return canvas.toDataURL("image/png");
}

// 6. Retro Nokia 3310 Generator
export async function renderNokiaCanvas(
  text: string,
  from: string = "Nexa",
  date: string = "08/06/2026",
  time: string = "12:00"
): Promise<string> {
  const canvas = document.createElement("canvas");
  canvas.width = 840;
  canvas.height = 540;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas context not available");

  // Nokia Phone Body Blue
  ctx.fillStyle = "#1e3d59";
  roundRect(ctx, 20, 20, 800, 500, 40);
  ctx.fill();

  // Nokia Screen Glass
  ctx.fillStyle = "#9bc09d";
  ctx.strokeStyle = "#384739";
  ctx.lineWidth = 4;
  roundRect(ctx, 120, 70, 600, 380, 16);
  ctx.fill();
  ctx.stroke();

  // Monospaced Pixel Text
  ctx.fillStyle = "#1c281d";
  ctx.font = "bold 20px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`1 MESSAGE RECEIVED`, 150, 120);
  ctx.fillText(`FROM: ${from.toUpperCase()}`, 150, 155);
  ctx.fillText(`TIME: ${time} ${date}`, 150, 190);

  ctx.strokeStyle = "#1c281d";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(150, 205);
  ctx.lineTo(690, 205);
  ctx.stroke();

  ctx.font = "bold 22px monospace";
  wrapText(ctx, `"${text || "Halo dari Nokia 3310!"}"`, 150, 250, 540, 32);

  // Softkeys
  ctx.font = "bold 18px monospace";
  ctx.fillText("READ", 150, 420);
  ctx.textAlign = "right";
  ctx.fillText("BACK", 690, 420);

  return canvas.toDataURL("image/png");
}

// Helper: Round Rectangle
function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

// Helper: Wrap Text
function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let n = 0; n < words.length; n++) {
    const testLine = line + words[n] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;
    if (testWidth > maxWidth && n > 0) {
      ctx.fillText(line, x, currentY);
      line = words[n] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, currentY);
}

// Helper: Fallback Avatar
function drawFallbackAvatar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  name: string
) {
  ctx.fillStyle = "#6366f1";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${Math.floor(r * 0.9)}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText((name || "N").charAt(0).toUpperCase(), x, y);
}
