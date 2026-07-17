# Add-card dialog revamp Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the split deck-page add-card flow with a single **AddCardDialog** (two-column card view + sticky action bar with in-deck count, printing picker, quantity stepper, gold CTA), add cached Scryfall React Query hooks, and make the backend support a quantity parameter with a transaction boundary and token-row dedup.

**Architecture:** New `AddCardDialog` opens (in the existing `OverlayWrapper`) when a card is chosen from the deck-page search; it reuses the card-face rendering via a small extracted `CardFaceView`, shows price chips + a `ManaCost` component + collapsible rulings, and carries the action controls. Scryfall reads move to cached React Query hooks. The `useAddCardToDeck` mutation gains a quantity and a single contextual toast; `backendDeckApi.addCardToDeck` sends `?quantity=N`; the server controller accepts `@RequestParam` quantity, `addCardToDeck` becomes `@Transactional`, and token mappings are de-duplicated.

**Tech Stack:** React 19 + TS + Vite, TanStack React Query, Tailwind v4 + shadcn/ui, Vitest + RTL; Spring Boot 3.4 / Java 21, JPA, JUnit 5 + Mockito.

## Global Constraints

- Client: Prettier `printWidth: 133`, 2-space indent. Vitest globals ENABLED — do NOT import `describe`/`it`/`expect`/`vi` (existing tests don't; `(x as jest.Mock)` casts are the house style). `@` → `client/src`.
- Dark theme is active — use theme tokens (`bg-card`, `bg-muted`, `text-muted-foreground`, `border-border`, `text-primary`, `text-destructive`, gold primary `Button`). No hardcoded Tailwind chrome colors.
- Server: 4-space indent, no Lombok, `jakarta.persistence.*`; for `@Transactional` on services use `jakarta.transaction.Transactional` (matches `MagicDeckCardService`). Throw plain `RuntimeException` for failures (global `RestExceptionHandler` → HTTP 400). Run server tests targeted: `./mvnw test -Dtest=ClassName`.
- The `MagicCard` TS type (from `@/api/scryfallApi`): `id: string`, `oracle_id: string`, `tcgplayer_id?: number`, `name: string`, `mana_cost: string`, `type_line: string`, `oracle_text: string`, `color_identity: string[]`, `keywords: string[]`, `rulings_uri: string`, `layout: string`, `prices: { eur?: string; usd?: string; ... }`, `image_uris?`, `card_faces?`.
- `DeckCardDetails` (from `@/api/backendDeckApi`): `{ id, card: MagicCardInterface, deck, quantity, commander }`; `card.cardName` is the name field.
- Commits: short, plain messages, NO `Co-Authored-By` trailer. Branch: `add-card-revamp`.
- Gate every task: `cd client && npm run lint && npm run build && npm run test` (client tasks) / `cd server && ./mvnw test -Dtest=...` (server tasks). Preserve the existing 98-test client suite.

---

## Task 1: Scryfall React Query hooks

**Files:**
- Create: `client/src/hooks/useScryfallQuery.tsx`
- Test: `client/src/hooks/__tests__/useScryfallQuery.test.tsx`

**Interfaces:**
- Produces: `useCardQuery(cardName)`, `useCardByTcgIdQuery(tcgId)`, `usePrintingsQuery(oracleId)`, `useCardRulingsQuery(rulingsUri, enabled)` — each returns a TanStack `useQuery` result (`.data`, `.isPending`, `.error`). All immutable (`staleTime: Infinity`), gated by `enabled` when the key arg is absent.

- [ ] **Step 1: Write the failing test** `client/src/hooks/__tests__/useScryfallQuery.test.tsx`

```tsx
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ScryfallApi } from "@/api/scryfallApi";
import { useCardQuery } from "../useScryfallQuery";

vi.mock("@/api/scryfallApi");

function wrapper(client: QueryClient) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
  };
}

describe("useScryfallQuery", () => {
  beforeEach(() => vi.clearAllMocks());

  it("useCardQuery returns the fetched card and caches by name", async () => {
    const card = { name: "Sol Ring", oracle_id: "o1" };
    (ScryfallApi.prototype.getCardByName as jest.Mock).mockResolvedValue(card);
    const client = new QueryClient();

    const first = renderHook(() => useCardQuery("Sol Ring"), { wrapper: wrapper(client) });
    await waitFor(() => expect(first.result.current.data).toEqual(card));

    // second mount with the SAME client uses cache — no refetch
    renderHook(() => useCardQuery("Sol Ring"), { wrapper: wrapper(client) });
    expect(ScryfallApi.prototype.getCardByName).toHaveBeenCalledTimes(1);
  });

  it("useCardQuery does not fetch when name is empty", () => {
    const client = new QueryClient();
    renderHook(() => useCardQuery(""), { wrapper: wrapper(client) });
    expect(ScryfallApi.prototype.getCardByName).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd client && npx vitest run src/hooks/__tests__/useScryfallQuery.test.tsx`
Expected: FAIL — `Failed to resolve import "../useScryfallQuery"`.

- [ ] **Step 3: Implement** `client/src/hooks/useScryfallQuery.tsx`

```tsx
import { useQuery } from "@tanstack/react-query";

import { ScryfallApi } from "@/api/scryfallApi";

const scryfallApi = new ScryfallApi();

export function useCardQuery(cardName: string) {
  return useQuery({
    queryKey: ["scryfallCard", cardName],
    queryFn: () => scryfallApi.getCardByName(cardName),
    enabled: !!cardName,
    staleTime: Infinity,
  });
}

export function useCardByTcgIdQuery(tcgId: number | undefined) {
  return useQuery({
    queryKey: ["scryfallCardTcg", tcgId],
    queryFn: () => scryfallApi.getCardByTcgId(tcgId!),
    enabled: !!tcgId,
    staleTime: Infinity,
  });
}

export function usePrintingsQuery(oracleId: string | undefined) {
  return useQuery({
    queryKey: ["scryfallPrintings", oracleId],
    queryFn: () => scryfallApi.getAllPrintings(oracleId!),
    enabled: !!oracleId,
    staleTime: Infinity,
  });
}

export function useCardRulingsQuery(rulingsUri: string | undefined, enabled: boolean) {
  return useQuery({
    queryKey: ["scryfallRulings", rulingsUri],
    queryFn: () => scryfallApi.getCardRulings(rulingsUri!),
    enabled: enabled && !!rulingsUri,
    staleTime: Infinity,
  });
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd client && npx vitest run src/hooks/__tests__/useScryfallQuery.test.tsx`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/hooks/useScryfallQuery.tsx client/src/hooks/__tests__/useScryfallQuery.test.tsx
git commit -m "client: add cached Scryfall React Query hooks"
```

---

## Task 2: Backend — quantity param + transactional add

**Files:**
- Modify: `server/src/main/java/com/mtg_app/controllers/DeckController.java` (add-card method, ~L177-190)
- Modify: `server/src/main/java/com/mtg_app/service/MagicDeckService.java` (annotate `addCardToDeck`)
- Test: `server/src/test/java/com/mtg_app/controllers/DeckControllerAddCardTest.java`

**Interfaces:**
- Consumes: `MagicDeckService.addCardToDeck(MagicDeck, MagicCardRequest, int quantity)` (already accepts quantity).
- Produces: `POST /api/v1/decks/{deckId}/add-card?quantity=N` (default 1; `< 1` rejected).

- [ ] **Step 1: Write the failing test** `DeckControllerAddCardTest.java` (standalone MockMvc + a Jwt argument resolver, since the method uses `@AuthenticationPrincipal Jwt`)

```java
package com.mtg_app.controllers;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.MethodParameter;
import org.springframework.http.MediaType;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.support.WebDataBinderFactory;
import org.springframework.web.context.request.NativeWebRequest;
import org.springframework.web.method.support.HandlerMethodArgumentResolver;
import org.springframework.web.method.support.ModelAndViewContainer;

import com.mtg_app.entity.MagicDeck;
import com.mtg_app.service.MagicCardService;
import com.mtg_app.service.MagicDeckCardService;
import com.mtg_app.service.MagicDeckCardTokenService;
import com.mtg_app.service.MagicDeckService;

class DeckControllerAddCardTest {

    private MagicDeckService magicDeckService;
    private MockMvc mockMvc;
    private final MagicDeck deck = new MagicDeck();

    @BeforeEach
    void setup() {
        MagicCardService magicCardService = mock(MagicCardService.class);
        magicDeckService = mock(MagicDeckService.class);
        MagicDeckCardService magicDeckCardService = mock(MagicDeckCardService.class);
        MagicDeckCardTokenService magicDeckCardTokenService = mock(MagicDeckCardTokenService.class);

        DeckController controller = new DeckController(magicCardService, magicDeckService, magicDeckCardService,
                magicDeckCardTokenService);

        HandlerMethodArgumentResolver jwtResolver = new HandlerMethodArgumentResolver() {
            @Override
            public boolean supportsParameter(MethodParameter parameter) {
                return parameter.getParameterType().equals(Jwt.class);
            }

            @Override
            public Object resolveArgument(MethodParameter parameter, ModelAndViewContainer mavContainer,
                    NativeWebRequest webRequest, WebDataBinderFactory binderFactory) {
                return Jwt.withTokenValue("t").header("alg", "none").subject("user-1").build();
            }
        };

        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setCustomArgumentResolvers(jwtResolver)
                .setControllerAdvice(new RestExceptionHandler())
                .build();

        when(magicDeckService.getDeckByDeckIdAndUserId(1, "user-1")).thenReturn(deck);
    }

    @Test
    void defaultsQuantityToOne() throws Exception {
        mockMvc.perform(post("/api/v1/decks/1/add-card")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Sol Ring\",\"tcgplayer_id\":1,\"color_identity\":[]}"))
                .andExpect(status().isOk());
        verify(magicDeckService).addCardToDeck(eq(deck), any(), eq(1));
    }

    @Test
    void passesExplicitQuantity() throws Exception {
        mockMvc.perform(post("/api/v1/decks/1/add-card?quantity=3")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Sol Ring\",\"tcgplayer_id\":1,\"color_identity\":[]}"))
                .andExpect(status().isOk());
        verify(magicDeckService).addCardToDeck(eq(deck), any(), eq(3));
    }

    @Test
    void rejectsQuantityBelowOne() throws Exception {
        mockMvc.perform(post("/api/v1/decks/1/add-card?quantity=0")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\":\"Sol Ring\",\"tcgplayer_id\":1,\"color_identity\":[]}"))
                .andExpect(status().isBadRequest());
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && ./mvnw test -Dtest=DeckControllerAddCardTest`
Expected: FAIL — `defaultsQuantityToOne`/`passesExplicitQuantity` fail (controller always passes `1`; no `quantity` param) and `rejectsQuantityBelowOne` fails (no validation yet).

- [ ] **Step 3: Update the controller** — `server/src/main/java/com/mtg_app/controllers/DeckController.java`. Add the import `import org.springframework.web.bind.annotation.RequestParam;` (near the other `web.bind.annotation` imports) and change the add-card method to:

```java
    @PostMapping("/{deckId}/add-card")
    public ResponseEntity<String> addCardToDeck(@AuthenticationPrincipal Jwt jwt, @PathVariable int deckId,
            @RequestBody MagicCardRequest cardRequest, @RequestParam(defaultValue = "1") int quantity) {

        String userId = jwt.getSubject();

        if (quantity < 1)
            throw new RuntimeException("Quantity must be at least 1");

        // Find deck by userId and deckID, if it does not exists throw an error
        MagicDeck deck = magicDeckService.getDeckByDeckIdAndUserId(deckId, userId);
        if (deck == null)
            throw new RuntimeException("No Deck found");

        this.magicDeckService.addCardToDeck(deck, cardRequest, quantity);
        return ResponseEntity.ok("Card added to deck");
    }
```

- [ ] **Step 4: Make `addCardToDeck` transactional** — in `server/src/main/java/com/mtg_app/service/MagicDeckService.java`, add `import jakarta.transaction.Transactional;` and annotate the method:

```java
    @Override
    @Transactional
    public void addCardToDeck(MagicDeck deck, MagicCardRequest card, int quantity) {
```

(Body unchanged.)

- [ ] **Step 5: Run to verify it passes**

Run: `cd server && ./mvnw test -Dtest=DeckControllerAddCardTest`
Expected: PASS (3 tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/main/java/com/mtg_app/controllers/DeckController.java server/src/main/java/com/mtg_app/service/MagicDeckService.java server/src/test/java/com/mtg_app/controllers/DeckControllerAddCardTest.java
git commit -m "server: accept quantity on add-card and make addCardToDeck transactional"
```

---

## Task 3: Backend — token mapping dedup

**Files:**
- Modify: `server/src/main/java/com/mtg_app/dao/MagicDeckCardTokenRepository.java` (add finder)
- Modify: `server/src/main/java/com/mtg_app/service/MagicDeckCardTokenService.java` (guard `createDeckCardTokenMapping`)
- Test: `server/src/test/java/com/mtg_app/service/MagicDeckCardTokenServiceTest.java`

**Interfaces:**
- Produces: `createDeckCardTokenMapping` becomes idempotent — inserts only when no `(deckId, cardId, tokenId)` row exists, else returns the existing row.

- [ ] **Step 1: Write the failing test** `MagicDeckCardTokenServiceTest.java`

```java
package com.mtg_app.service;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import org.junit.jupiter.api.Test;

import com.mtg_app.dao.MagicDeckCardTokenRepository;
import com.mtg_app.entity.MagicDeckCardToken;

class MagicDeckCardTokenServiceTest {

    private final MagicDeckCardTokenRepository repo = mock(MagicDeckCardTokenRepository.class);
    private final MagicDeckCardTokenService service = new MagicDeckCardTokenService(repo);

    @Test
    void createsMappingWhenAbsent() {
        MagicDeckCardToken mapping = new MagicDeckCardToken(1, 2, "tok");
        when(repo.findByDeckIdAndCardIdAndTokenId(1, 2, "tok")).thenReturn(null);
        when(repo.save(mapping)).thenReturn(mapping);

        MagicDeckCardToken result = service.createDeckCardTokenMapping(mapping);

        assertSame(mapping, result);
        verify(repo).save(mapping);
    }

    @Test
    void doesNotDuplicateWhenPresent() {
        MagicDeckCardToken existing = new MagicDeckCardToken(1, 2, "tok");
        when(repo.findByDeckIdAndCardIdAndTokenId(1, 2, "tok")).thenReturn(existing);

        MagicDeckCardToken result = service.createDeckCardTokenMapping(new MagicDeckCardToken(1, 2, "tok"));

        assertSame(existing, result);
        verify(repo, never()).save(any());
    }
}
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd server && ./mvnw test -Dtest=MagicDeckCardTokenServiceTest`
Expected: FAIL — compilation error (`findByDeckIdAndCardIdAndTokenId` does not exist) and, once compiling, `doesNotDuplicateWhenPresent` fails (current code always saves).

- [ ] **Step 3: Add the finder** — in `server/src/main/java/com/mtg_app/dao/MagicDeckCardTokenRepository.java`, add this derived-query method inside the interface (after the existing methods):

```java
    MagicDeckCardToken findByDeckIdAndCardIdAndTokenId(int deckId, int cardId, String tokenId);
```

- [ ] **Step 4: Guard the service** — in `server/src/main/java/com/mtg_app/service/MagicDeckCardTokenService.java`, replace `createDeckCardTokenMapping` with:

```java
    @Override
    public MagicDeckCardToken createDeckCardTokenMapping(MagicDeckCardToken tokenMapping) {
        MagicDeckCardToken existing = this.magicDeckCardTokenRepository.findByDeckIdAndCardIdAndTokenId(
                tokenMapping.getDeckId(), tokenMapping.getCardId(), tokenMapping.getTokenId());
        if (existing != null) {
            return existing;
        }
        return magicDeckCardTokenRepository.save(tokenMapping);
    }
```

- [ ] **Step 5: Run to verify it passes**

Run: `cd server && ./mvnw test -Dtest=MagicDeckCardTokenServiceTest`
Expected: PASS (2 tests).

- [ ] **Step 6: Commit**

```bash
git add server/src/main/java/com/mtg_app/dao/MagicDeckCardTokenRepository.java server/src/main/java/com/mtg_app/service/MagicDeckCardTokenService.java server/src/test/java/com/mtg_app/service/MagicDeckCardTokenServiceTest.java
git commit -m "server: dedup deck-card-token mappings on add"
```

---

## Task 4: ManaCost component

**Files:**
- Create: `client/src/components/cards/ManaCost.tsx`
- Test: `client/src/components/cards/__tests__/ManaCost.test.tsx`

**Interfaces:**
- Produces: default `ManaCost({ mana_cost?: string })` rendering one `<img data-testid="mana-symbol">` per `{...}` symbol (Scryfall SVGs); named `parseManaSymbols(manaCost?): string[]`.

- [ ] **Step 1: Write the failing test** `client/src/components/cards/__tests__/ManaCost.test.tsx`

```tsx
import { render, screen } from "@testing-library/react";
import ManaCost, { parseManaSymbols } from "../ManaCost";

describe("ManaCost", () => {
  it("parses mana cost into symbol codes", () => {
    expect(parseManaSymbols("{3}{U}{R}{G}")).toEqual(["3", "U", "R", "G"]);
    expect(parseManaSymbols("")).toEqual([]);
    expect(parseManaSymbols(undefined)).toEqual([]);
  });

  it("renders one image per symbol", () => {
    render(<ManaCost mana_cost="{3}{U}{R}{G}" />);
    expect(screen.getAllByTestId("mana-symbol")).toHaveLength(4);
  });

  it("renders nothing for an empty cost", () => {
    render(<ManaCost mana_cost="" />);
    expect(screen.queryByTestId("mana-symbol")).toBeNull();
  });
});
```

- [ ] **Step 2: Run to verify it fails**

Run: `cd client && npx vitest run src/components/cards/__tests__/ManaCost.test.tsx`
Expected: FAIL — `Failed to resolve import "../ManaCost"`.

- [ ] **Step 3: Implement** `client/src/components/cards/ManaCost.tsx`

```tsx
interface Props {
  mana_cost?: string;
}

export function parseManaSymbols(manaCost?: string): string[] {
  if (!manaCost) return [];
  const matches = manaCost.match(/\{([^}]+)\}/g) ?? [];
  return matches.map((token) => token.slice(1, -1));
}

function symbolUrl(code: string): string {
  return `https://svgs.scryfall.io/card-symbols/${code.replace("/", "")}.svg`;
}

export default function ManaCost({ mana_cost }: Props) {
  const symbols = parseManaSymbols(mana_cost);
  if (symbols.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {symbols.map((code, idx) => (
        <img key={`${code}-${idx}`} src={symbolUrl(code)} alt={code} title={code} className="w-4 h-4" data-testid="mana-symbol" />
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Run to verify it passes**

Run: `cd client && npx vitest run src/components/cards/__tests__/ManaCost.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add client/src/components/cards/ManaCost.tsx client/src/components/cards/__tests__/ManaCost.test.tsx
git commit -m "client: add ManaCost component"
```

---

## Task 5: Extract CardFaceView; migrate FullCardInfo + Rulings to hooks

**Files:**
- Create: `client/src/components/cards/CardFaceView.tsx`
- Modify: `client/src/components/cards/FullCardInfo.tsx` (use `CardFaceView` + `useCardQuery`)
- Modify: `client/src/components/cards/Ruling.tsx` (use `useCardRulingsQuery`)

**Interfaces:**
- Consumes: `useCardQuery`, `useCardRulingsQuery` (Task 1).
- Produces: default `CardFaceView({ card: MagicCard })` — the layout dispatch (single / DFC / adventure|split / meld). `FullCardInfo` unchanged externally (still `{ cardName }`). `Rulings` unchanged externally (still `{ rulingUri }`).

This task is a refactor with no new test — verified by the existing suite staying green + build/lint (no component here has a dedicated test).

- [ ] **Step 1: Create `CardFaceView.tsx`**

```tsx
import type { MagicCard } from "@/api/scryfallApi";
import SingleFacedCard from "./SingleFacedCard";
import DoubleFacedCard from "./DoubleFacedCard";
import AdventureCard from "./AdventureCard";
import MeldCard from "./MeldCard";

export default function CardFaceView({ card }: { card: MagicCard }) {
  return (
    <>
      {card.layout === "normal" && <SingleFacedCard card={card} />}
      {(card.layout === "transform" || card.layout === "modal_dfc") && <DoubleFacedCard card={card} />}
      {(card.layout === "adventure" || card.layout === "split") && <AdventureCard card={card} />}
      {card.layout === "meld" && <MeldCard card={card} />}
    </>
  );
}
```

- [ ] **Step 2: Refactor `FullCardInfo.tsx`** to fetch via `useCardQuery` and render via `CardFaceView`. Replace the whole file with:

```tsx
import Loader from "../ui/Loader";
import CardFaceView from "./CardFaceView";
import Rulings from "./Ruling";
import ErrorMessage from "../ui/ErrorMessage";
import { useCardQuery } from "@/hooks/useScryfallQuery";

interface Props {
  cardName: string;
}

export default function FullCardInfo({ cardName }: Readonly<Props>) {
  const { data: card, isPending, error } = useCardQuery(cardName);

  if (isPending) return <Loader />;
  if (error || !card) return <ErrorMessage msg={error ? error.message : "Failed to fetch card data"} />;

  return (
    <div className="my-10">
      <CardFaceView card={card} />

      <div className="flex gap-3">
        <p>EUR: {card.prices.eur}</p>
        <p>USD: {card.prices.usd}</p>
      </div>

      <div className="mt-4 text-right">
        <Rulings rulingUri={card.rulings_uri} />
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Refactor `Ruling.tsx`** to use `useCardRulingsQuery`. Replace the fetch/`useEffect` with the hook; keep the same external prop `{ rulingUri }`, the same "Rules" heading, and the same `rule.comment` rendering keyed by `oracle_id + idx`. Full file:

```tsx
import { useCardRulingsQuery } from "@/hooks/useScryfallQuery";

interface Props {
  rulingUri: string;
}

export default function Rulings({ rulingUri }: Readonly<Props>) {
  const { data: rules } = useCardRulingsQuery(rulingUri, true);

  if (!rules || rules.length < 1) return null;

  return (
    <div className="max-h-72 overflow-auto">
      <h3 className="font-bold">Rules</h3>
      {rules.map((rule, idx) => (
        <p key={rule.oracle_id + idx} className="mt-2 text-sm">
          {rule.comment}
        </p>
      ))}
    </div>
  );
}
```

- [ ] **Step 4: Verify the suite + build**

Run: `cd client && npm run lint && npm run build && npm run test`
Expected: lint clean; build succeeds; the full existing suite passes (98 + Task 1 hooks + Task 4 ManaCost tests). If any pre-existing test rendered `FullCardInfo`/`Rulings` and mocked `ScryfallApi` directly, it still passes (the hooks call the same `ScryfallApi` methods). Confirm no test regressed.

- [ ] **Step 5: Commit**

```bash
git add client/src/components/cards/CardFaceView.tsx client/src/components/cards/FullCardInfo.tsx client/src/components/cards/Ruling.tsx
git commit -m "client: extract CardFaceView and move card/ruling fetches to cached hooks"
```

---

## Task 6: AddCardDialog + wiring (quantity, single toast, spinner)

**Files:**
- Modify: `client/src/api/backendDeckApi.tsx` (`addCardToDeck` gains `quantity`)
- Modify: `client/src/components/decks/useDeckQuery.tsx` (`useAddCardToDeck` — quantity, single contextual toast, spinner)
- Create: `client/src/components/decks/AddCardDialog.tsx`
- Modify: `client/src/pages/DeckDetails.tsx` (replace the search/eye/Add region with `AddCardDialog`)
- Test: `client/src/components/decks/__tests__/AddCardDialog.test.tsx`

**Interfaces:**
- Consumes: `useCardByTcgIdQuery`, `usePrintingsQuery` (Task 1), `CardFaceView` (Task 5), `ManaCost` (Task 4), `Rulings` (Task 5), shadcn `Select`/`Button`, `useAddCardToDeck`.
- Produces: `AddCardDialog({ card: MagicCard, deckColorIdentity: string, commanderNames: string[], deckCards: DeckCardDetails[] })`; `addCard({ card: MagicCard, quantity: number })`; `backendDeckApi.addCardToDeck(deckId, card, idToken, quantity?)`.

- [ ] **Step 1: Update `backendDeckApi.addCardToDeck`** — in `client/src/api/backendDeckApi.tsx`, change the method to send quantity:

```tsx
  async addCardToDeck(deckId: number | string, card: MagicCard, idToken: string, quantity: number = 1) {
    try {
      const response = await axios.post(`${this.base_url}/${deckId}/add-card?quantity=${quantity}`, card, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      return response.data;
    } catch (err) {
      const error = err as ErrorResponse;
      throw new Error(`${error.response.status}:  ${error.response.statusText}`);
    }
  }
```

- [ ] **Step 2: Update `useAddCardToDeck`** — in `client/src/components/decks/useDeckQuery.tsx`, replace the hook with (single contextual toast; mutate takes `{ card, quantity }`):

```tsx
export function useAddCardToDeck() {
  const queryClient = useQueryClient();
  const { deckId } = useParams();
  const { idToken } = useUser();

  const { isPending: addingCard, mutate: addCard } = useMutation({
    mutationFn: ({ card, quantity }: { card: MagicCard; quantity: number }) =>
      deckApi.addCardToDeck(deckId!, card, idToken, quantity),
    onSuccess: (_data, { card, quantity }) => {
      queryClient.invalidateQueries({ queryKey: ["deckById"] });
      toast.success(`Added ×${quantity} ${card.name}`);
    },
    onError: (error) => toast.error(`Could not add card: ${(error as Error).message}`),
  });

  return { addingCard, addCard };
}
```

- [ ] **Step 3: Write the failing test** `client/src/components/decks/__tests__/AddCardDialog.test.tsx`

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import AddCardDialog from "../AddCardDialog";
import { useAddCardToDeck } from "../useDeckQuery";
import { usePrintingsQuery, useCardByTcgIdQuery } from "@/hooks/useScryfallQuery";

vi.mock("../useDeckQuery");
vi.mock("@/hooks/useScryfallQuery");
vi.mock("@/components/cards/CardFaceView", () => ({ default: ({ card }: any) => <div>{card.name}</div> }));
vi.mock("@/components/cards/Ruling", () => ({ default: () => <div>rulings</div> }));
vi.mock("@/components/cards/ManaCost", () => ({ default: () => <div>mana</div> }));
vi.mock("@/components/ui/select", () => ({
  Select: ({ children }: any) => <div>{children}</div>,
  SelectContent: ({ children }: any) => <div>{children}</div>,
  SelectGroup: ({ children }: any) => <div>{children}</div>,
  SelectItem: ({ children }: any) => <div>{children}</div>,
  SelectTrigger: ({ children }: any) => <div>{children}</div>,
  SelectValue: () => <span />,
}));

const baseCard = {
  name: "Sol Ring",
  oracle_id: "o1",
  tcgplayer_id: 1,
  mana_cost: "{1}",
  color_identity: [] as string[],
  rulings_uri: "r",
  prices: { eur: "1.50", usd: "2.00" },
} as any;

describe("AddCardDialog", () => {
  const mockAddCard = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAddCardToDeck as jest.Mock).mockReturnValue({ addingCard: false, addCard: mockAddCard });
    (usePrintingsQuery as jest.Mock).mockReturnValue({ data: [] });
    (useCardByTcgIdQuery as jest.Mock).mockReturnValue({ data: undefined, isPending: false });
  });

  function renderDialog(overrides = {}) {
    return render(
      <AddCardDialog card={baseCard} deckColorIdentity="WUBRG" commanderNames={[]} deckCards={[]} {...overrides} />
    );
  }

  it("renders the card, price chips, and quantity", () => {
    renderDialog();
    expect(screen.getByText("Sol Ring")).toBeInTheDocument();
    expect(screen.getByText(/1.50/)).toBeInTheDocument();
    expect(screen.getByText(/2.00/)).toBeInTheDocument();
    expect(screen.getByTestId("quantity")).toHaveTextContent("1");
  });

  it("increments and clamps quantity, and adds the card with the chosen quantity", () => {
    renderDialog();
    fireEvent.click(screen.getByLabelText("increase quantity"));
    expect(screen.getByTestId("quantity")).toHaveTextContent("2");
    fireEvent.click(screen.getByRole("button", { name: /Add to Deck/ }));
    expect(mockAddCard).toHaveBeenCalledWith({ card: baseCard, quantity: 2 });
  });

  it("shows the in-deck count from deckCards", () => {
    renderDialog({ deckCards: [{ card: { cardName: "Sol Ring" }, quantity: 3 }] });
    expect(screen.getByText(/In deck: .*3/)).toBeInTheDocument();
  });

  it("blocks an off-color card and does not add", () => {
    renderDialog({ card: { ...baseCard, color_identity: ["B"] }, deckColorIdentity: "WUG" });
    expect(screen.getByText(/not in the deck's color identity/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add to Deck/ }));
    expect(mockAddCard).not.toHaveBeenCalled();
  });

  it("blocks adding the commander", () => {
    renderDialog({ commanderNames: ["Sol Ring"] });
    expect(screen.getByText(/Cannot add the commander/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Add to Deck/ }));
    expect(mockAddCard).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 4: Run to verify it fails**

Run: `cd client && npx vitest run src/components/decks/__tests__/AddCardDialog.test.tsx`
Expected: FAIL — `Failed to resolve import "../AddCardDialog"`.

- [ ] **Step 5: Implement `AddCardDialog.tsx`**

```tsx
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CardFaceView from "@/components/cards/CardFaceView";
import ManaCost from "@/components/cards/ManaCost";
import Rulings from "@/components/cards/Ruling";
import Loader from "@/components/ui/Loader";
import { useAddCardToDeck } from "./useDeckQuery";
import { useCardByTcgIdQuery, usePrintingsQuery } from "@/hooks/useScryfallQuery";
import type { MagicCard } from "@/api/scryfallApi";
import type { DeckCardDetails } from "@/api/backendDeckApi";

interface Props {
  card: MagicCard;
  deckColorIdentity: string;
  commanderNames: string[];
  deckCards: DeckCardDetails[];
}

export default function AddCardDialog({ card, deckColorIdentity, commanderNames, deckCards }: Props) {
  const { addingCard, addCard } = useAddCardToDeck();
  const [selectedTcgId, setSelectedTcgId] = useState<number | undefined>(card.tcgplayer_id);
  const [quantity, setQuantity] = useState(1);
  const [showRulings, setShowRulings] = useState(false);

  const { data: printings } = usePrintingsQuery(card.oracle_id);
  const isDifferentPrinting = !!selectedTcgId && selectedTcgId !== card.tcgplayer_id;
  const { data: printingCard, isPending: loadingPrinting } = useCardByTcgIdQuery(isDifferentPrinting ? selectedTcgId : undefined);
  const displayCard: MagicCard = isDifferentPrinting && printingCard ? printingCard : card;

  const inDeckCount = deckCards
    .filter((dc) => dc.card.cardName === displayCard.name)
    .reduce((sum, dc) => sum + dc.quantity, 0);

  const offColor = displayCard.color_identity.some((c) => !deckColorIdentity.includes(c));
  const isCommander = commanderNames.includes(displayCard.name);
  const blockedReason = offColor
    ? `${displayCard.name} is not in the deck's color identity`
    : isCommander
      ? "Cannot add the commander to the deck"
      : null;

  function changeQty(delta: number) {
    setQuantity((q) => Math.min(99, Math.max(1, q + delta)));
  }

  function addHandler() {
    if (blockedReason) return;
    addCard({ card: displayCard, quantity });
    setQuantity(1);
  }

  const eur = displayCard.prices?.eur;
  const usd = displayCard.prices?.usd;

  return (
    <div className="w-[min(90vw,700px)]">
      {isDifferentPrinting && loadingPrinting ? (
        <Loader />
      ) : (
        <>
          <CardFaceView card={displayCard} />
          <div className="mt-3 flex items-center gap-3">
            <ManaCost mana_cost={displayCard.mana_cost} />
            {eur && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">&euro; {eur}</span>}
            {usd && <span className="rounded-md border border-border bg-muted px-2 py-0.5 text-xs font-bold">$ {usd}</span>}
          </div>
          <div className="mt-3">
            <button
              className="text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setShowRulings((s) => !s)}
            >
              {showRulings ? "▾" : "▸"} Rulings
            </button>
            {showRulings && <Rulings rulingUri={displayCard.rulings_uri} />}
          </div>
        </>
      )}

      {blockedReason && <p className="mt-3 font-bold text-destructive">{blockedReason}</p>}

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4">
        <div className="flex items-center gap-3">
          <span className="text-xs font-bold text-primary">
            {inDeckCount > 0 ? `In deck: ×${inDeckCount}` : "Not in deck"}
          </span>
          {printings && printings.length > 1 && (
            <Select value={String(selectedTcgId)} onValueChange={(v) => setSelectedTcgId(Number(v))}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Printing" />
              </SelectTrigger>
              <SelectContent className="max-h-72">
                <SelectGroup>
                  {printings.map((p) => (
                    <SelectItem key={p.tcgplayer_id} value={String(p.tcgplayer_id)}>
                      {p.setName}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="flex items-center gap-2">
          <div className="inline-flex items-center overflow-hidden rounded-md border border-border">
            <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(-1)} aria-label="decrease quantity">
              &minus;
            </button>
            <span className="w-9 text-center font-bold" data-testid="quantity">
              {quantity}
            </span>
            <button className="bg-muted px-3 py-1 text-lg" onClick={() => changeQty(1)} aria-label="increase quantity">
              +
            </button>
          </div>
          <Button onClick={addHandler} disabled={!!blockedReason || addingCard}>
            {addingCard ? "Adding…" : "+ Add to Deck"}
          </Button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 6: Run the AddCardDialog test to verify it passes**

Run: `cd client && npx vitest run src/components/decks/__tests__/AddCardDialog.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Wire `AddCardDialog` into `DeckDetails.tsx`**

Remove now-unused pieces and the old add region. Specifically:
- Remove the imports `import { FaEye } from "react-icons/fa";`, `import FullCardInfo from "@/components/cards/FullCardInfo";`, and `useAddCardToDeck` from the `useDeckQuery` import (keep `useDeleteDeck, useGetDeckById, useUpdateDeck`). Add `import AddCardDialog from "@/components/decks/AddCardDialog";`.
- Remove the `const { addCard } = useAddCardToDeck();` line, the `showCardInfoOverlay` state, `toggleCardInfoOverlayHandler`, and the entire `addCardToDeckHandler` function.
- Replace the deck-list search block (the `<div className="flex justify-center items-center flex-col px-5">…</div>` containing the search + `FaEye` + "Add card" `Button` + the `showCardInfoOverlay` overlay, currently ~L244-257) with:

```tsx
            <div className="flex flex-col items-center justify-center px-5">
              <CardSearchWithAutoComplete label="Search Card" setValue={setCardToSearch} />
              {cardToSearch && (
                <OverlayWrapper hideFn={() => setCardToSearch(null)}>
                  <AddCardDialog
                    card={cardToSearch}
                    deckColorIdentity={deckColorIdentity}
                    commanderNames={commanderName}
                    deckCards={deckById!}
                  />
                </OverlayWrapper>
              )}
            </div>
```

(`OverlayWrapper` is already imported and still used for `FileUpload`. `commanderName` and `deckColorIdentity` are the existing L89-90 values. `toast` remains used elsewhere in the file — keep its import.)

- [ ] **Step 8: Type-check, then run the full gate**

Run: `cd client && npx tsc -b`
Expected: exit 0 (no unused-import or type errors; if `tsc` flags an unused `toast`/import, remove only the genuinely unused ones).
Run: `cd client && npm run lint && npm run build && npm run test`
Expected: lint clean; build succeeds; all tests pass (98 existing + hooks + ManaCost + AddCardDialog).

- [ ] **Step 9: Commit**

```bash
git add client/src/api/backendDeckApi.tsx client/src/components/decks/useDeckQuery.tsx client/src/components/decks/AddCardDialog.tsx client/src/pages/DeckDetails.tsx client/src/components/decks/__tests__/AddCardDialog.test.tsx
git commit -m "client: replace add-card flow with AddCardDialog (quantity, printing, single toast, spinner)"
```

---

## Manual verification (after all tasks)

Run `cd client && npm run dev` (or `docker compose up`), open a deck, search a card: the dialog shows the card with mana pips + € / $ chips + collapsible rulings, an "In deck" count, a printing dropdown (when >1 printing), a quantity stepper (clamped 1–99), and a gold **Add to Deck** button (disabled + "Adding…" while pending, disabled with an inline message for off-color/commander). Adding N shows a single "Added ×N …" toast and the in-deck count updates. Confirm a token-maker added twice does not create duplicate token rows (pgAdmin: `SELECT * FROM magic_deck_card_token`).
