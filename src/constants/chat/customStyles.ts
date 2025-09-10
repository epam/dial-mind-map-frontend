export const CustomStylesPlaceholder = `.chat-container {
  /* Root wrapper for the chat panel (including header, messages, input, etc.) */
  /* e.g., background, border, padding, width */

  .chat-header {
    /* Header bar at the top of the chat (e.g., where control buttons live) */
    /* e.g., layout, spacing, background, border */

    .history-reset-button {
      /* Button to reset or clear the chat state */
      /* e.g., font-size, color, visibility, background */
    }

    .toggle-mindmap-button {
      /* Button to toggle visibility of the mindmap/graph view */
      /* e.g., display, visibility, size, icon color */
    }
  }

  .chat-conversation {
    /* Container holding the list of all chat messages */
    /* e.g., spacing between messages, background, scroll behavior */

    .chat-conversation__message {
      /* A single chat message bubble */
      /* e.g., padding, background-color, border-radius, font styles */

      &.chat-conversation__message--active {
        /* The currently selected or "active" chat message */
        /* e.g., special background, outline, margin, highlight color */
      }

      .chat-conversation__message-icon {
        /* Icon inside a message (e.g., source marker, AI/user badge) */
        /* e.g., visibility, size, margin, color */
      }

      .chat-conversation__message-nodes {
        /* Wrapper for all message nodes inside a single chat message */
        /* e.g., layout direction, spacing between nodes, alignment */
        
        .chat-conversation__message-node {
          /* Individual node item within a message */
          /* e.g., size, hover effects, font styles, interaction states */
        }
      }
    }
  }

  .chat-footer {
    /* The input and controls area at the bottom of the chat */
    /* e.g., margin, layout, spacing between elements */

    .chat-footer__input {
      /* The main text input field for user messages */
      /* e.g., height, background, border, shadow, border-radius */
    }

    .chat-footer__submit-btn {
      /* The button used to send a message */
      /* e.g., padding, background-color, border-radius, icon behavior */
    }

    .mobile-menu-toggle-button {
      /* Mobile-only button that opens .mobile-menu */
    }

    .mobile-menu {
      /* Mobile-only popup menu inside chat-footer. Contains level switcher and reset button */
    }
  }
}

.level-switcher {
  /* Top-level container for the level switcher tabs (e.g., "1-level" / "2-level") */
  /* e.g., border, background, spacing between buttons */

  .level-switcher__button {
    /* Individual switcher button */
    /* e.g., font-size, padding, border-bottom, background, alignment */

    &.level-switcher__button--active {
      /* Currently selected/active switcher button */
      /* e.g., border-color, text color, font weight */
    }
  }
}

.graph-fit-button {
  /* Fitting graph button */
  /* e.g., font-size, padding, border-bottom, background, alignment */
}

.reference-view {
  /* Main container for the reference fullscreen preview/view element */
  /* e.g., border styles, shadow, padding, positioning */
}`;
