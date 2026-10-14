import { useEffect, useId, useRef } from 'react'

/* anticlockwise turn, degrees per second at rest (22s for a full circle) */
const SPIN = 16
/* how far the cursor can lean the icon, in degrees */
const MAX_LEAN = 7
/* motion blur: copies trailing the sharp one, each a little further back
   along the turn and fainter, so the smear grows with the speed */
const GHOSTS = [
  { lag: 0, opacity: 1 },
  { lag: 1.5, opacity: 0.34 },
  { lag: 3.1, opacity: 0.16 },
  { lag: 5, opacity: 0.075 },
]

/* -------------------------------------------------------------- shape morph
   the transparent png sits on a disc, so the moving edge has to come from a
   clip. every shape below is written as "how far from the middle is the edge at
   this angle", and they are all sampled at the same angles into the same number
   of points, so the turn between any two of them is nothing but numbers lerped
   from one outline to the other — the path itself morphs, nothing is scaled,
   turned or swapped out. */

type Pt = [number, number]
/** Distance from the middle of the artwork out to its edge, at an angle. */
type Shape = (angle: number) => number

const SIZE = 512
const MID = SIZE / 2
/* one point every 15°: enough that the circle stays smooth, few enough that the
   hexagon's corners land exactly on samples */
const POINTS = 24

/** The rest state, a hair outside the artwork, so at rest the edge you see is
    the artwork's own. Every other shape stays inside that edge, or the clip
    would show empty corners. */
const circle: Shape = () => 258

/* wider than it is tall */
const OVAL_X = 250
const OVAL_Y = 186
const oval: Shape = (t) =>
  (OVAL_X * OVAL_Y) / Math.hypot(OVAL_Y * Math.cos(t), OVAL_X * Math.sin(t))

/* a rounded rectangle is a rectangle with its corners rounded off by a disc, so
   along any angle the edge is either a straight side or that disc: the sides
   hold until the ray passes the end of one, and past that it is the corner's
   circle to solve for */
const ROUND_W = 440
const ROUND_H = 356
const ROUND_R = 76
const rounded: Shape = (t) => {
  const c = Math.abs(Math.cos(t))
  const s = Math.abs(Math.sin(t))
  /* the rectangle the corner disc is centred on */
  const ax = ROUND_W / 2 - ROUND_R
  const ay = ROUND_H / 2 - ROUND_R
  let edge = Infinity

  if (c > 0) {
    const r = ROUND_W / 2 / c
    if (r * s <= ay) edge = r
  }
  if (s > 0) {
    const r = ROUND_H / 2 / s
    if (r * c <= ax) edge = Math.min(edge, r)
  }

  const cd = ax * c + ay * s
  const disc = cd * cd - (ax * ax + ay * ay - ROUND_R * ROUND_R)
  if (disc >= 0) {
    const r = cd + Math.sqrt(disc)
    if (r * c >= ax && r * s >= ay) edge = Math.min(edge, r)
  }

  return edge
}

/* a hexagon is a circle's worth of angle cut into six flats, so the edge is the
   apothem over how far off the middle of the nearest side the ray is */
const HEX_APOTHEM = 216
const HEX_SIDE = Math.PI / 3
const hexagon: Shape = (t) => {
  const off = ((((t + HEX_SIDE / 2) % HEX_SIDE) + HEX_SIDE) % HEX_SIDE) - HEX_SIDE / 2
  return HEX_APOTHEM / Math.cos(off)
}

/* the loop, in order: round, then stretched, then squared off, then cut into
   six, and back round again */
const SHAPES = [circle, oval, rounded, hexagon]
const LEGS = SHAPES.length

/* -------------------------------------------------------------- the motion
   under-damped springs sail past the shape they were sent to and come back
   instead of easing to a stop. the target is the next shape in the loop, and it
   moves on at the top of the swing, so the morph is always on its way
   somewhere: no cycle to wait out, no hold in the turn. */
const STIFFNESS = 55
const DAMPING_RATIO = 0.5
const DAMPING = 2 * DAMPING_RATIO * Math.sqrt(STIFFNESS)
/* explicit integration goes unstable past a fraction of the period, so the
   frame is taken in small bites */
const SUBSTEPS = 4

const round = (v: number) => Math.round(v * 10) / 10
const mix = (a: number, b: number, u: number) => a + (b - a) * u

/** Closed catmull-rom spline, written as the cubics a path takes. */
function pathOf(points: Pt[]): string {
  const n = points.length
  const at = (i: number) => points[((i % n) + n) % n]
  const head = at(0)
  let d = `M${round(head[0])} ${round(head[1])}`

  for (let i = 0; i < n; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]

    d += `C${round(c1[0])} ${round(c1[1])} ${round(c2[0])} ${round(c2[1])} ${round(
      p2[0],
    )} ${round(p2[1])}`
  }

  return `${d}Z`
}

/** A shape's points, one every POINTS-th of the turn. */
function pointsOf(shape: Shape): Pt[] {
  return Array.from({ length: POINTS }, (_, i) => {
    const t = (i / POINTS) * Math.PI * 2
    const r = shape(t)
    return [MID + r * Math.cos(t), MID + r * Math.sin(t)]
  })
}

/* every shape sampled once, in the order the loop runs them */
const OUTLINES = SHAPES.map(pointsOf)

/** The loop is round, so a leg past the last shape is on into the first. */
const wrap = (leg: number) => ((leg % LEGS) + LEGS) % LEGS

/** The outline anywhere in the loop: `at` counts shapes, so 0 is the circle, 1
    the oval, 2 the rounded rectangle, 3 the hexagon, and 4 is the circle
    again. A quarter of the way along a leg is a quarter of the way between the
    two outlines. */
function pathAt(at: number): string {
  const leg = Math.floor(at)
  const u = at - leg
  const from = OUTLINES[wrap(leg)]
  const into = OUTLINES[wrap(leg + 1)]
  return pathOf(from.map((p, k): Pt => [mix(p[0], into[k][0], u), mix(p[1], into[k][1], u)]))
}

/* the transparent Pokédex icon, shown while the turn is at rest. built off the
   app base so it still resolves when the site is served from /Pokedex/ */
const ICON_SRC = `${import.meta.env.BASE_URL}pokedex-favicon/favicon.svg`

/* what the icon shows before the first frame lands on it */
const REST = pathAt(0)

/** The Pokédex mark, turning anticlockwise in its own box, its outline springing
    from shape to shape through the loop so the artwork's edge is always moving. */
export function Logo({ className = '' }: { className?: string }) {
  const box = useRef<HTMLDivElement>(null)
  const spinner = useRef<HTMLDivElement>(null)
  const shape = useRef<SVGPathElement>(null)
  const clipId = `logo-shape-${useId().replace(/[^a-z0-9]/gi, '')}`

  useEffect(() => {
    const host = box.current
    const disc = spinner.current
    const outlinePath = shape.current
    if (!host || !disc || !outlinePath) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let angle = 0
    let lean = 0
    let wantX = 0
    /* where the outline is in the loop, in shapes: 0 circle, 1 oval, 2 rounded
       rectangle, 3 hexagon — and which way it is travelling, and whether it is
       already past the shape it was sent to */
    let morphAt = 0
    let morphTo = 1
    let morphVel = 0
    let morphDir = 1
    let swung = false
    let last = performance.now()
    let raf = 0

    /* never start blind: if the first observer callback lands before layout
       settles, the icon must not sit still */
    const rect = host.getBoundingClientRect()
    let onScreen = rect.bottom > 0 && rect.top < window.innerHeight

    const paint = () => {
      /* css rotate() grows clockwise, so the falling angle is the anticlockwise turn */
      disc.style.transform = `rotateX(${lean.toFixed(2)}deg) rotate(${angle.toFixed(2)}deg)`

      outlinePath.setAttribute('d', pathAt(morphAt))
    }

    /* the outline's own spring, pulled towards the shape it is headed for and
       kicked back by its own speed. it is under-damped on purpose: it sails
       past that shape, turns at the top of the swing, and the next shape in the
       loop becomes the target — the overshoot is the expressive part, and the
       turn is what keeps it going without a pause */
    const morph = (dt: number) => {
      const h = dt / SUBSTEPS
      for (let i = 0; i < SUBSTEPS; i++) {
        morphVel += ((morphTo - morphAt) * STIFFNESS - morphVel * DAMPING) * h
        morphAt += morphVel * h

        /* past the shape it was sent to and still going that way, so the swing
           is under way */
        if (morphVel * morphDir > 0 && (morphAt - morphTo) * morphDir >= 0) swung = true
        /* the turn is at the top of the swing, where the spring stops pushing */
        if (swung && morphVel * morphDir <= 0) {
          morphTo += 1
          morphDir = -morphDir
          swung = false
        }
      }

      /* the loop is a round one, so once round the counter is wrapped back into
         it — the target goes with it, which leaves the spring exactly where it
         was and the shape on screen exactly where it was too */
      if (morphAt >= LEGS || morphAt < 0) {
        const shift = Math.floor(morphAt / LEGS) * LEGS
        morphAt -= shift
        morphTo -= shift
      }
    }

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now

      /* the turn falls anticlockwise; the cursor can speed it up on the right
         and slow it on the left, and the icon leans towards the pointer */
      angle -= SPIN * (1 + wantX * 0.5) * dt
      lean += (wantX * MAX_LEAN * 0.55 - lean) * Math.min(dt * 6, 1)
      morph(dt)
      paint()

      raf = window.requestAnimationFrame(frame)
    }

    const start = () => {
      if (raf) return
      last = performance.now()
      raf = window.requestAnimationFrame(frame)
    }

    const stop = () => {
      window.cancelAnimationFrame(raf)
      raf = 0
    }

    const syncMotion = () => {
      stop()
      /* reduced motion means the turn does not run, so the outline has to be
         back at rest too — otherwise the icon freezes half morphed */
      if (reduce.matches) {
        morphAt = 0
        morphTo = 1
        morphVel = 0
        morphDir = 1
        swung = false
      }
      if (onScreen && !document.hidden) {
        start()
      } else {
        paint()
      }
    }

    const onPointer = (e: PointerEvent) => {
      wantX = Math.max(-1, Math.min(1, (e.clientX / window.innerWidth) * 2 - 1))
    }

    const onVisibility = () => {
      if (document.hidden) stop()
      else syncMotion()
    }

    const onReduce = () => syncMotion()

    window.addEventListener('pointermove', onPointer, { passive: true })
    document.addEventListener('visibilitychange', onVisibility)
    reduce.addEventListener('change', onReduce)

    const observer = new IntersectionObserver(
      ([entry]) => {
        onScreen = entry.isIntersecting
        syncMotion()
      },
      { rootMargin: '160px' },
    )
    observer.observe(host)

    syncMotion()

    return () => {
      observer.disconnect()
      window.removeEventListener('pointermove', onPointer)
      document.removeEventListener('visibilitychange', onVisibility)
      reduce.removeEventListener('change', onReduce)
      stop()
    }
  }, [])

  return (
    <div ref={box} className={className} aria-hidden="true">
      <div className="logo-frame">
        <div ref={spinner} className="logo-spinner">
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="logo-svg">
            <defs>
              <clipPath id={clipId}>
                <path ref={shape} d={REST} />
              </clipPath>
            </defs>

            <g clipPath={`url(#${clipId})`}>
              {GHOSTS.map((ghost) => (
                <image
                  key={ghost.lag}
                  href={ICON_SRC}
                  width={SIZE}
                  height={SIZE}
                  opacity={ghost.opacity}
                  transform={`rotate(${ghost.lag} ${MID} ${MID})`}
                />
              ))}
            </g>
          </svg>
        </div>
      </div>
    </div>
  )
}
