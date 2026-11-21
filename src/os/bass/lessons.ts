/**
 * The bass course: levels from open strings to grooves and songs. Each
 * lesson is one concept, explained in a few lines, with notes to play.
 *
 * Notes use the format in theory.ts ("E5", "A3-0.5", "r-1", "|").
 * Grooves are original patterns in common styles. Songs are public-domain
 * melodies (Beethoven, traditional hymns and folk tunes), played on bass.
 */
import { parse, timeline, type Step } from "./theory";

export interface Lesson {
  key: string;
  level: number;
  title: string;
  concept: string; // one line: what this teaches
  explain: string[]; // a few short lines to read first
  bpm: number; // starting tempo
  beatsPerBar: number;
  notes: string;
  tip?: string;
}

export const LEVELS = [
  { level: 1, name: "Meet the bass", goal: "The five open strings and how to pluck them." },
  { level: 2, name: "Frets and fingers", goal: "Pressing notes cleanly, one finger per fret." },
  { level: 3, name: "Rhythm", goal: "Playing in time: quarter notes, eighth notes and rests." },
  { level: 4, name: "Roots and shapes", goal: "The shapes bass players use under every song." },
  { level: 5, name: "Scales", goal: "Major and minor pentatonic, and using the low B." },
  { level: 6, name: "Grooves", goal: "Putting notes and rhythm together in different styles." },
  { level: 7, name: "Songs", goal: "Whole tunes, start to finish." },
];

export const LESSONS: Lesson[] = [
  // 1 · Meet the bass
  {
    key: "open-strings",
    level: 1,
    title: "The four top strings",
    concept: "Open E, A, D and G: pluck each one four times.",
    explain: ["Open means you don't press any fret; just pluck.", "Pluck with your index and middle fingers, taking turns, resting on the string below after each pluck.", "Count out loud: 1, 2, 3, 4."],
    bpm: 60,
    beatsPerBar: 4,
    notes: "E0 E0 E0 E0 | A0 A0 A0 A0 | D0 D0 D0 D0 | G0 G0 G0 G0",
  },
  {
    key: "low-b",
    level: 1,
    title: "The low B string",
    concept: "Your fifth string: the deepest note on the bass.",
    explain: ["The low B is the thickest string, above the E.", "Rest your thumb on it when you play the other strings, so it doesn't ring by accident.", "Then all five, low to high and back."],
    bpm: 60,
    beatsPerBar: 4,
    notes: "B0 B0 B0 B0 | E0 E0 E0 E0 | B0 E0 A0 D0 | G0 D0 A0 E0",
    tip: "Muting the strings you're not playing is half of sounding clean on a 5-string.",
  },
  {
    key: "string-jumps",
    level: 1,
    title: "Crossing strings",
    concept: "Jumping between strings without looking.",
    explain: ["Keep your plucking hand loose and move it with the string.", "Try it once slowly looking, then without looking."],
    bpm: 66,
    beatsPerBar: 4,
    notes: "E0 A0 E0 A0 | A0 D0 A0 D0 | D0 G0 D0 G0 | B0 E0 B0 E0",
  },

  // 2 · Frets and fingers
  {
    key: "e-string-notes",
    level: 2,
    title: "Notes on the E string",
    concept: "E, F, G and A: your first fretted notes.",
    explain: ["Press just behind the fret (the metal bar), not on top of it.", "Use finger 1 for fret 1, finger 3 or 4 for fret 3, finger 4 for fret 5 (you'll shift).", "Press only as hard as you need for a clean note."],
    bpm: 60,
    beatsPerBar: 4,
    notes: "E0 E1 E3 E5 | E5 E3 E1 E0 | E0 E1 E3 E5 | E3 E1 E0-2",
  },
  {
    key: "a-string-notes",
    level: 2,
    title: "Notes on the A string",
    concept: "A, B, C and D.",
    explain: ["Same idea on the next string up: A, B, C, D.", "Notice fret 5 on one string is the same note as the open string above it."],
    bpm: 60,
    beatsPerBar: 4,
    notes: "A0 A2 A3 A5 | A5 A3 A2 A0 | A0 A2 A3 A5 | D0-4",
    tip: "Fret 5 on A is D, the same as open D: that's how you tune by ear too.",
  },
  {
    key: "spider",
    level: 2,
    title: "One finger per fret",
    concept: "The finger workout every bass player does.",
    explain: ["Fingers 1, 2, 3, 4 on frets 1, 2, 3, 4, one string at a time.", "Leave each finger down until you need it again.", "Slow and even beats fast and messy."],
    bpm: 60,
    beatsPerBar: 4,
    notes: "E1 E2 E3 E4 | A1 A2 A3 A4 | D1 D2 D3 D4 | G1 G2 G3 G4",
  },

  // 3 · Rhythm
  {
    key: "quarters",
    level: 3,
    title: "Quarter notes",
    concept: "One note on every beat, locked to the click.",
    explain: ["Bass is the bridge between the drums and the song. Time comes first.", "Play exactly on the click. Count 1, 2, 3, 4."],
    bpm: 80,
    beatsPerBar: 4,
    notes: "A0 A0 A0 A0 | A0 A0 A0 A0 | D0 D0 D0 D0 | A0 A0 A0 A0",
  },
  {
    key: "eighths",
    level: 3,
    title: "Eighth notes",
    concept: "Two notes per beat: 1 & 2 & 3 & 4 &.",
    explain: ["Twice as many notes, same click.", "Alternate fingers strictly: index, middle, index, middle."],
    bpm: 70,
    beatsPerBar: 4,
    notes: "A0-0.5 A0-0.5 A0-0.5 A0-0.5 A0-0.5 A0-0.5 A0-0.5 A0-0.5 | E5-0.5 E5-0.5 E5-0.5 E5-0.5 E5-0.5 E5-0.5 E5-0.5 E5-0.5",
  },
  {
    key: "rests",
    level: 3,
    title: "Rests",
    concept: "Silence on purpose: stop the note on the rest.",
    explain: ["A rest is a beat where you don't play, and the note before it stops.", "Lift your fretting finger slightly, or touch the string, to stop it."],
    bpm: 72,
    beatsPerBar: 4,
    notes: "A0 r-1 A0 r-1 | A0 A0 r-1 A0 | E5 r-1 E5 E5 | A0-2 r-2",
  },
  {
    key: "push",
    level: 3,
    title: "Long and short",
    concept: "Mixing lengths: a long note, then a short one.",
    explain: ["The first note lasts one and a half beats, the next half a beat.", "Feel it: 1 (2) & … then the next."],
    bpm: 70,
    beatsPerBar: 4,
    notes: "A0-1.5 A0-0.5 A0-1.5 A0-0.5 | E5-1.5 E5-0.5 E5-1.5 E5-0.5",
  },

  // 4 · Roots and shapes
  {
    key: "root-fifth",
    level: 4,
    title: "Root and fifth",
    concept: "The most used shape in bass: the root, then up a string and over two frets.",
    explain: ["The root is the chord's name note (A for an A chord).", "The fifth is one string higher, two frets up. Same shape everywhere on the neck."],
    bpm: 72,
    beatsPerBar: 4,
    notes: "E5 A7 E5 A7 | A5 D7 A5 D7 | E3 A5 E3 A5 | E5 A7 E5-2",
    tip: "A on E5 then E on A7; D on A5 then A on D7; G on E3 then D on A5.",
  },
  {
    key: "octave",
    level: 4,
    title: "The octave",
    concept: "The same note, higher: two strings up, two frets over.",
    explain: ["Root on the E string, octave two strings up and two frets higher.", "Fret the root with finger 1 and the octave with finger 3 or 4."],
    bpm: 72,
    beatsPerBar: 4,
    notes: "E5-0.5 D7-0.5 E5-0.5 D7-0.5 E5-0.5 D7-0.5 E5-0.5 D7-0.5 | A5-0.5 G7-0.5 A5-0.5 G7-0.5 A5-0.5 G7-0.5 A5-0.5 G7-0.5",
  },
  {
    key: "root-fifth-octave",
    level: 4,
    title: "Root, fifth, octave",
    concept: "Combining the two shapes into a line.",
    explain: ["Root, fifth, octave, fifth: it walks up and back.", "Works under almost any major or minor chord."],
    bpm: 76,
    beatsPerBar: 4,
    notes: "E5 A7 D7 A7 | A5 D7 G7 D7 | E3 A5 D5 A5 | E5 A7 D7 A7",
  },

  // 5 · Scales
  {
    key: "c-major",
    level: 5,
    title: "C major scale",
    concept: "Do re mi: the scale most songs are built from.",
    explain: ["Start on C (A string, 3rd fret), go up eight notes and back down.", "Pattern: whole, whole, half, whole, whole, whole, half steps."],
    bpm: 66,
    beatsPerBar: 4,
    notes: "A3 A5 D2 D3 | D5 G2 G4 G5 | G4 G2 D5 D3 | D2 A5 A3-2",
  },
  {
    key: "a-minor-pentatonic",
    level: 5,
    title: "A minor pentatonic",
    concept: "Five notes that sound good over almost anything: grooves and fills live here.",
    explain: ["The box at the 5th fret: two notes per string.", "Finger 1 on fret 5, finger 4 on frets 7 and 8."],
    bpm: 70,
    beatsPerBar: 4,
    notes: "E5 E8 A5 A7 | D5 D7 G5 G7 | G5 D7 D5 A7 | A5 E8 E5-2",
  },
  {
    key: "low-b-scale",
    level: 5,
    title: "Down low on the B string",
    concept: "E minor pentatonic starting on the low B: what the 5th string is for.",
    explain: ["B string, 5th fret is low E, the same note as the open E string.", "Playing it on the B string lets you stay in one hand position."],
    bpm: 66,
    beatsPerBar: 4,
    notes: "B5 B8 E5 E7 | A5 A7 D5 D7 | D5 A7 A5 E7 | E5 B8 B5-2",
  },

  // 6 · Grooves (original patterns)
  {
    key: "gospel-root-five",
    level: 6,
    title: "Gospel and country: root–five",
    concept: "Root and fifth on the beat, moving with the chords C, F, G.",
    explain: ["Every bar is a chord: C, F, C, G.", "Root on 1 and 3, fifth on 2 and 4. Steady and warm."],
    bpm: 84,
    beatsPerBar: 4,
    notes: "A3 D5 A3 D5 | E1 A3 E1 A3 | A3 D5 A3 D5 | E3 A5 E3 A5",
  },
  {
    key: "soul-octaves",
    level: 6,
    title: "Soul octaves",
    concept: "Bouncing between root and octave in eighth notes.",
    explain: ["A bar on A, a bar on D.", "Keep the eighths even and let the octave pop slightly."],
    bpm: 90,
    beatsPerBar: 4,
    notes: "E5-0.5 D7-0.5 E5-0.5 D7-0.5 E5-0.5 D7-0.5 E5-0.5 D7-0.5 | A5-0.5 G7-0.5 A5-0.5 G7-0.5 A5-0.5 G7-0.5 A5-0.5 G7-0.5",
  },
  {
    key: "afrobeat-groove",
    level: 6,
    title: "Afrobeat-style groove",
    concept: "Syncopation: notes between the beats, rests on them.",
    explain: ["In A minor, using the pentatonic box.", "The gaps are the groove. Stop each note right on the rest."],
    bpm: 96,
    beatsPerBar: 4,
    notes: "E5-0.5 r-0.5 E5-0.5 E8-0.5 r-0.5 A5-0.5 E8-0.5 r-0.5 | E5-0.5 r-0.5 E5-0.5 E8-0.5 r-0.5 A7-0.5 A5-0.5 r-0.5",
  },
  {
    key: "reggae-groove",
    level: 6,
    title: "Reggae-style groove",
    concept: "Space and weight: miss beat one on purpose.",
    explain: ["Reggae bass leaves the first beat empty and leans on the rest.", "Play behind the click, relaxed."],
    bpm: 76,
    beatsPerBar: 4,
    notes: "r-0.5 E5-0.5 E5-1 r-0.5 E8-0.5 A5-1 | r-0.5 A5-0.5 A5-1 r-0.5 E8-0.5 E5-1",
  },
  {
    key: "funk-sixteenths",
    level: 6,
    title: "Funk sixteenths",
    concept: "Four notes per beat, with rests for punch.",
    explain: ["Count 1 e & a, 2 e & a…", "Start slow; speed comes later."],
    bpm: 70,
    beatsPerBar: 4,
    notes: "E5-0.25 E5-0.25 r-0.25 D7-0.25 r-0.25 E5-0.25 D7-0.25 r-0.25 E5-0.25 r-0.25 E5-0.25 E8-0.25 r-0.25 A5-0.25 E8-0.25 r-0.25",
  },
  {
    key: "walking-blues",
    level: 6,
    title: "Walking blues in A",
    concept: "A 12-bar blues, walking up each chord: A, D and E.",
    explain: ["The 12-bar blues: 4 bars of A, 2 of D, 2 of A, then E, D, A, E.", "Each bar walks up the chord: root, 3rd, 5th, 6th."],
    bpm: 88,
    beatsPerBar: 4,
    notes:
      "E5 A4 A7 A9 | E5 A4 A7 A9 | E5 A4 A7 A9 | E5 A4 A7 A9 | A5 D4 D7 D9 | A5 D4 D7 D9 | E5 A4 A7 A9 | E5 A4 A7 A9 | A7 D6 D9 G6 | A5 D4 D7 D9 | E5 A4 A7 A9 | A7 D6 D9 G6",
  },

  // 7 · Songs (public domain)
  {
    key: "twinkle",
    level: 7,
    title: "Twinkle, Twinkle, Little Star",
    concept: "A whole tune in C, all in one hand position.",
    explain: ["Traditional. Every note is on the A, D or G string, frets 2 to 5.", "Hum it first; it helps you hear mistakes."],
    bpm: 84,
    beatsPerBar: 4,
    notes:
      "A3 A3 D5 D5 | G2 G2 D5-2 | D3 D3 D2 D2 | A5 A5 A3-2 | D5 D5 D3 D3 | D2 D2 A5-2 | D5 D5 D3 D3 | D2 D2 A5-2 | A3 A3 D5 D5 | G2 G2 D5-2 | D3 D3 D2 D2 | A5 A5 A3-2",
  },
  {
    key: "ode-to-joy",
    level: 7,
    title: "Ode to Joy",
    concept: "Beethoven's melody, with a long-short rhythm at the end of each line.",
    explain: ["Beethoven, 1824. Stepwise notes around C.", "Watch the dotted note: one and a half beats, then half a beat."],
    bpm: 90,
    beatsPerBar: 4,
    notes:
      "D2 D2 D3 D5 | D5 D3 D2 A5 | A3 A3 A5 D2 | D2-1.5 A5-0.5 A5-2 | D2 D2 D3 D5 | D5 D3 D2 A5 | A3 A3 A5 D2 | A5-1.5 A3-0.5 A3-2",
  },
  {
    key: "saints",
    level: 7,
    title: "When the Saints Go Marching In",
    concept: "Long notes and pickups: start on the 'and', not the 1.",
    explain: ["Traditional. Each phrase starts after a rest: 'Oh when the' leads into a long note.", "Hold the long notes for their full length."],
    bpm: 100,
    beatsPerBar: 4,
    notes: "r-1 A3 D2 D3 | D5-4 | r-1 A3 D2 D3 | D5-4 | r-1 A3 D2 D3 | D5-2 D2-2 | A3-2 D2-2 | A5-4 | r-1 D2 D2 A5 | A3-3 A3-1 | D2-2 D5-2 | D5-1 D3-3 | r-1 D2 D3 D5 | D2-2 A3-2 | A5-4 | A3-4",
  },
  {
    key: "amazing-grace",
    level: 7,
    title: "Amazing Grace (first line)",
    concept: "Three beats to a bar, and a reach down to low G.",
    explain: ["Hymn, 1779, in 3/4: count 1, 2, 3.", "Low G is the E string, 3rd fret (or the B string, 8th fret)."],
    bpm: 72,
    beatsPerBar: 3,
    notes: "r-2 E3 | A3-2 D2-0.5 A3-0.5 | D2-2 A5 | A3-2 E5 | E3-2 E3 | A3-2 D2-0.5 A3-0.5 | D2-2 A5 | D5-3",
  },
];

/** Steps and timing for a lesson. */
export function prepare(lesson: Lesson): { steps: Step[]; starts: number[]; total: number; bars: number } {
  const steps = parse(lesson.notes);
  const { starts, total } = timeline(steps);
  return { steps, starts, total, bars: Math.ceil(total / lesson.beatsPerBar - 1e-6) };
}

/** The next lesson to do: the first one without 2 stars. */
export function nextLesson(stars: Record<string, number>): Lesson {
  return LESSONS.find((l) => (stars[l.key] || 0) < 2) || LESSONS[LESSONS.length - 1];
}
