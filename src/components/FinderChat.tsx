import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { useFinderData } from '../hooks/useFinderData'
import {
  createSignals,
  describeSignals,
  isEmptySignals,
  mergeSignals,
  parseQuery,
  type FinderMatch,
  type FinderSignals,
} from '../lib/finder'
import { artworkUrlById, formatName, formatNumber } from '../lib/format'
import { ErrorBox, Loader } from './Feedback'
import { SendIcon, SparkleIcon } from './Icons'
import { TypeBadge } from './TypeBadge'

const PAGE_SIZE = 6
const CHIP_LIMIT = 12

interface ChatMessage {
  id: number
  role: 'user' | 'assistant'
  text?: string
  matches?: FinderMatch[]
  total?: number
  chips?: string[]
}

const SUGGESTIONS = [
  'small yellow electric mouse',
  'big blue turtle with a hard shell',
  'legendary black dragon',
  'round pink balloon-like with big eyes',
]

const REPLACE_CUE = /(instead|actually|rather|switch to|change it|no wait|scrap that)/i

const INTRO =
  'Describe a Pokémon from memory — colours, size, body parts, type, an ability, where it lives — and I’ll rank the closest matches from the Pokédex data. Follow up to refine.'

let messageId = 0
function nextId() {
  messageId += 1
  return messageId
}

function introMessage(): ChatMessage {
  return { id: nextId(), role: 'assistant', text: INTRO }
}

/**
 * The Pokémon Finder chatbox. Every message is turned into structured search
 * signals, folded into the session's accumulated description, and matched
 * locally against the PokéAPI-derived dataset. No AI service is involved.
 */
export function FinderChat() {
  const { state, retry } = useFinderData()
  const [messages, setMessages] = useState<ChatMessage[]>(() => [introMessage()])
  const [signals, setSignals] = useState<FinderSignals>(() => createSignals())
  const [input, setInput] = useState('')
  const [limit, setLimit] = useState(PAGE_SIZE)
  const [searched, setSearched] = useState(false)

  const threadRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const thread = threadRef.current
    if (thread) thread.scrollTop = thread.scrollHeight
  }, [messages])

  const ready = state.status === 'ready'
  const engine = ready ? state.engine : null

  function runQuery(text: string) {
    if (!engine) return
    const trimmed = text.trim()
    if (!trimmed) return

    const delta = parseQuery(trimmed)
    const next = mergeSignals(signals, delta, REPLACE_CUE.test(trimmed))

    let reply: ChatMessage

    if (isEmptySignals(next)) {
      reply = {
        id: nextId(),
        role: 'assistant',
        text: 'I couldn’t pick out any detail from that. Try a colour, type, size, body part, ability or habitat.',
      }
    } else {
      const matches = engine.search(next, PAGE_SIZE)
      if (matches.length === 0) {
        reply = {
          id: nextId(),
          role: 'assistant',
          text: 'No Pokémon in the Pokédex matched that combination. Try fewer or different details, or start over.',
        }
      } else {
        reply = {
          id: nextId(),
          role: 'assistant',
          matches,
          total: engine.countMatches(next),
          chips: describeSignals(next),
        }
      }
    }

    setMessages((previous) => [
      ...previous,
      { id: nextId(), role: 'user', text: trimmed },
      reply,
    ])
    setSignals(next)
    setLimit(PAGE_SIZE)
    setSearched(true)
    setInput('')
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    runQuery(input)
  }

  function showMore() {
    if (!engine) return
    const nextLimit = limit + PAGE_SIZE
    const matches = engine.search(signals, nextLimit)
    setMessages((previous) => {
      const copy = [...previous]
      for (let index = copy.length - 1; index >= 0; index -= 1) {
        if (copy[index].matches) {
          copy[index] = { ...copy[index], matches }
          break
        }
      }
      return copy
    })
    setLimit(nextLimit)
  }

  function startOver() {
    setMessages([introMessage()])
    setSignals(createSignals())
    setInput('')
    setLimit(PAGE_SIZE)
    setSearched(false)
    inputRef.current?.focus()
  }

  const canShowMore =
    ready &&
    searched &&
    (() => {
      for (let index = messages.length - 1; index >= 0; index -= 1) {
        const message = messages[index]
        if (message.matches) return (message.total ?? message.matches.length) > message.matches.length
      }
      return false
    })()

  return (
    <div className="finder">
      <div className="finder-head">
        <div className="finder-head-text">
          <p className="label">
            <SparkleIcon size={12} /> Local description search
          </p>
          <h1 className="display finder-title">Pokémon Finder</h1>
          <p className="prose-dim finder-subtitle">
            Describe a Pokémon by colour, appearance, size, body features, ability or type —
            even without knowing its name.
          </p>
        </div>

        {searched && (
          <button type="button" className="btn finder-reset" onClick={startOver}>
            Start over
          </button>
        )}
      </div>

      <div className="finder-thread" ref={threadRef} aria-live="polite">
        {messages.map((message) => (
          <Message
            key={message.id}
            message={message}
            onShowMore={showMore}
            canShowMore={canShowMore}
          />
        ))}

        {state.status === 'loading' && <Loader label="Loading Pokémon data" />}
        {state.status === 'error' && <ErrorBox message={state.message} onRetry={retry} />}
      </div>

      {!searched && ready && (
        <div className="finder-suggestions">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="finder-suggestion"
              onClick={() => runQuery(suggestion)}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      <form className="finder-composer" onSubmit={handleSubmit}>
        <input
          ref={inputRef}
          type="text"
          className="field finder-input"
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="e.g. a small yellow mouse with red cheeks and lightning"
          autoComplete="off"
          autoCapitalize="none"
          spellCheck={false}
          aria-label="Describe a Pokémon"
          disabled={!ready}
        />
        <button
          type="submit"
          className="btn btn-accent finder-send"
          disabled={!ready || !input.trim()}
        >
          <SendIcon /> Find
        </button>
      </form>

      <p className="finder-note meta">
        Matching runs locally against Pokémon data from PokéAPI. No external AI service is used.
      </p>
    </div>
  )
}

interface MessageProps {
  message: ChatMessage
  onShowMore: () => void
  canShowMore: boolean
}

function Message({ message, onShowMore, canShowMore }: MessageProps) {
  if (message.role === 'user') {
    return (
      <div className="finder-msg finder-msg-user">
        <p className="finder-bubble">{message.text}</p>
      </div>
    )
  }

  return (
    <div className="finder-msg finder-msg-assistant">
      {message.text && <p className="finder-bubble">{message.text}</p>}

      {message.chips && message.chips.length > 0 && (
        <div className="finder-chips" aria-label="What was understood">
          <span className="finder-chips-label">Looking for</span>
          {message.chips.slice(0, CHIP_LIMIT).map((chip, index) => (
            <span key={`${chip}-${index}`} className="finder-chip">
              {chip}
            </span>
          ))}
          {message.chips.length > CHIP_LIMIT && (
            <span className="finder-chip">+{message.chips.length - CHIP_LIMIT} more</span>
          )}
        </div>
      )}

      {message.matches && message.matches.length > 0 && (
        <>
          <ul className="finder-results">
            {message.matches.map((match) => (
              <ResultCard key={match.pokemon.id} match={match} />
            ))}
          </ul>

          <div className="finder-results-foot">
            <p className="meta finder-count">
              {message.matches.length}
              {message.total && message.total > message.matches.length
                ? ` of ${message.total}`
                : ''}{' '}
              match{message.matches.length === 1 ? '' : 'es'}
            </p>
            {canShowMore && (
              <button type="button" className="btn finder-more" onClick={onShowMore}>
                Show more <span aria-hidden="true">↓</span>
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}

function ResultCard({ match }: { match: FinderMatch }) {
  const { pokemon, reasons } = match
  const name = formatName(pokemon.name)

  return (
    <li>
      <Link
        to={`/pokemon/${pokemon.name}`}
        className="finder-result"
        aria-label={`View details for ${name}, ${formatNumber(pokemon.id)}`}
      >
        <span className="finder-result-art">
          <img
            src={artworkUrlById(pokemon.id)}
            alt=""
            width={200}
            height={200}
            loading="lazy"
            decoding="async"
            className="finder-result-image"
          />
        </span>

        <span className="finder-result-body">
          <span className="finder-result-heading">
            <span className="pokemon-number">{formatNumber(pokemon.id)}</span>
            <span className="finder-result-name">{name}</span>
          </span>

          <span className="type-list finder-result-types">
            {pokemon.types.map((type) => (
              <TypeBadge key={type} type={formatName(type)} />
            ))}
          </span>

          {reasons.length > 0 && (
            <span className="finder-reasons">
              {reasons.map((reason) => (
                <span key={reason} className="finder-reason">
                  {reason}
                </span>
              ))}
            </span>
          )}
        </span>
      </Link>
    </li>
  )
}
