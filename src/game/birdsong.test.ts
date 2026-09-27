import assert from "node:assert/strict";
import test from "node:test";
import { HEAL_TONE, isHealTone, resetBirdsong, songOf, takeSongs, tickBirdsong, voiceOf, type Heard } from "./birdsong.ts";

function yard(): Heard {
  return {
    clock: 0,
    time: 0.2,
    weather: "clear",
    health: 100,
    mana: 100,
    x: 180,
    y: 320,
    cat: { x: 40, y: 40 },
    reaper: { x: 40, y: 40 },
    birds: [
      { id: "bird-1", x: 84, y: 252, mode: "stand", seed: 11 },
      { id: "bird-2", x: 200, y: 320, mode: "stand", seed: 29 },
      { id: "bird-3", x: 140, y: 396, mode: "stand", seed: 47 },
      { id: "bird-4", x: 268, y: 368, mode: "stand", seed: 71 },
      { id: "bird-5", x: 304, y: 428, mode: "stand", seed: 97 },
    ],
  };
}

test("each bird has the song shape of a real species", () => {
  assert.equal(voiceOf("bird-1"), "robin");
  assert.equal(voiceOf("bird-2"), "blackbird");
  assert.equal(voiceOf("bird-3"), "wren");
  assert.equal(voiceOf("bird-4"), "thrush");
  assert.equal(voiceOf("bird-5"), "dove");

  const robin = songOf("robin", 0).map((n) => n.p);
  assert.ok(robin[0] === "h" || robin[0] === "vh");
  assert.ok(robin.includes("m"));

  const blackbird = songOf("blackbird", 0);
  assert.ok(blackbird[1]!.at - blackbird[0]!.at >= 0.4, "a blackbird does not rush");
  assert.equal(blackbird[blackbird.length - 1]!.p, "m");

  const wren = songOf("wren", 0).map((n) => n.p);
  assert.ok(wren.filter((p) => p === "vh").length >= 4);

  const thrush = songOf("thrush", 0);
  const motif = thrush.filter((n) => n.p === "m").length;
  assert.ok(motif >= 3, "a thrush repeats the motif");

  const dove = songOf("dove", 0).map((n) => n.p);
  assert.ok(dove.every((p) => p === "l" || p === "vl"));
  assert.equal(dove.filter((p) => p === "vl").length, 2);
});

test("the old tone is the only phrase that climbs every pitch and returns", () => {
  assert.equal(isHealTone(HEAL_TONE), true);
  assert.deepEqual(
    HEAL_TONE.map((n) => n.p),
    ["vl", "l", "m", "h", "vh", "m"],
  );
  assert.equal(isHealTone(songOf("robin", 0)), false);
  assert.equal(isHealTone(songOf("blackbird", 0)), false);
  assert.equal(isHealTone(songOf("dove", 0)), false);
});

test("a storm keeps them quiet and night leaves only the dove's coo", () => {
  resetBirdsong();
  const s = yard();
  s.clock = 30;
  s.weather = "storm";
  s.health = 40;
  for (const b of s.birds!) {
    b.mode = "stand";
    b.x = s.x;
    b.y = s.y;
  }
  tickBirdsong(s, 0.05, false);
  assert.equal(takeSongs().length, 0);

  s.weather = "clear";
  s.time = 0.95;
  for (let i = 0; i < 160; i++) {
    s.clock += 0.05;
    tickBirdsong(s, 0.05, false);
  }
  const night = takeSongs();
  assert.ok(night.length > 0);
  for (const sung of night) {
    assert.ok(sung.notes.every((n) => n.p === "l" || n.p === "vl"));
  }
});

test("the old tone mends only after it resolves, and only for someone close and hurt", () => {
  resetBirdsong();
  const s = yard();
  s.clock = 40;
  s.time = 0.2;
  s.weather = "clear";
  s.health = 100;
  s.mana = 100;
  const bird = s.birds!.find((b) => b.id === "bird-2")!;
  bird.mode = "stand";
  bird.x = s.x + 20;
  bird.y = s.y;
  bird.seed = 29;
  for (let i = 0; i < 30; i++) {
    const healed = tickBirdsong(s, 0.05, false);
    assert.equal(healed, null);
  }
  assert.equal(
    takeSongs().some((sung) => isHealTone(sung.notes)),
    false,
  );

  s.health = 50;
  s.clock = 80;
  let heard = false;
  let healedAt: { health: number; mana: number } | null = null;
  for (let i = 0; i < 200 && !healedAt; i++) {
    const songs = takeSongs();
    if (songs.some((sung) => isHealTone(sung.notes))) heard = true;
    const got = tickBirdsong(s, 0.05, false);
    if (got) healedAt = got;
    s.clock += 0.05;
  }
  assert.equal(heard, true);
  assert.deepEqual(healedAt, { health: 6, mana: 8 });
});
