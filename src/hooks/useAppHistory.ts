import { useEffect, useRef } from "react";
import { AuthUser } from "../types";
import { AppScreen } from "../services/appScreen";

interface HistoryState {
  screen: AppScreen;
  userId?: string;
}

function screenToHash(screen: AppScreen) {
  return `#${screen}`;
}

function hashToScreen(hash: string): AppScreen | null {
  const screen = hash.replace(/^#/, "") as AppScreen;
  const valid: AppScreen[] = [
    "login",
    "register",
    "teacher_dash",
    "teacher_marking",
    "student_dash",
    "student_checkin"
  ];
  return valid.includes(screen) ? screen : null;
}

export function useAppHistory(
  activeScreen: AppScreen,
  currentUser: AuthUser | null,
  storeReady: boolean,
  setActiveScreen: (screen: AppScreen) => void
) {
  const isPopState = useRef(false);
  const historyReady = useRef(false);
  const prevScreenRef = useRef<AppScreen>("login");
  const userRef = useRef(currentUser);
  const screenRef = useRef(activeScreen);

  useEffect(() => {
    userRef.current = currentUser;
  }, [currentUser]);

  useEffect(() => {
    screenRef.current = activeScreen;
  }, [activeScreen]);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      isPopState.current = true;
      const state = event.state as HistoryState | null;

      if (state?.screen) {
        if (state.screen === "login" && userRef.current) {
          window.history.pushState(
            { screen: screenRef.current, userId: userRef.current.id },
            "",
            screenToHash(screenRef.current)
          );
          isPopState.current = false;
          return;
        }

        setActiveScreen(state.screen);
        prevScreenRef.current = state.screen;
        isPopState.current = false;
        return;
      }

      const hashScreen = hashToScreen(window.location.hash);
      if (hashScreen && hashScreen !== "login") {
        setActiveScreen(hashScreen);
        prevScreenRef.current = hashScreen;
        isPopState.current = false;
        return;
      }

      if (userRef.current) {
        const trappedScreen = screenRef.current;
        window.history.pushState(
          { screen: trappedScreen, userId: userRef.current.id },
          "",
          screenToHash(trappedScreen)
        );
      }

      isPopState.current = false;
    };

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [setActiveScreen]);

  useEffect(() => {
    if (!storeReady || isPopState.current) {
      isPopState.current = false;
      return;
    }

    const prev = prevScreenRef.current;
    const state: HistoryState = {
      screen: activeScreen,
      userId: currentUser?.id
    };
    const url = screenToHash(activeScreen);

    const shouldReplace =
      !historyReady.current ||
      activeScreen === "login" ||
      activeScreen === "register" ||
      (prev === "login" && activeScreen !== "login") ||
      (prev === "register" && activeScreen !== "register");

    if (shouldReplace) {
      window.history.replaceState(state, "", url);
      historyReady.current = true;
    } else if (prev !== activeScreen) {
      window.history.pushState(state, "", url);
    }

    prevScreenRef.current = activeScreen;
  }, [activeScreen, currentUser, storeReady]);
}
