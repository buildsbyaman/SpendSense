# SpendSense App Design System Analysis

Based on the provided screenshots, here is a detailed breakdown of the UI/UX design system. The overarching theme is a modern, clean, and highly rounded "glassmorphic/neumorphic-lite" aesthetic with generous whitespace and clear visual hierarchies.

## 1. Color Palette

*   **Backgrounds:**
    *   **App Background:** A very soft, off-white/light gray (e.g., `#F8F9FA` or similar). This helps the stark white content cards stand out.
    *   **Surface/Cards:** Pure white (`#FFFFFF`) for lists and standard containers.
    *   **Dark Theme Card (Balance):** A deep charcoal or near-black (`#1C1C1E` or similar) with subtle gradients or blurred background shapes for depth.
*   **Typography Colors:**
    *   **Primary Text:** High contrast solid black (`#000000`) for main titles, balances, and names.
    *   **Secondary/Muted Text:** Medium gray (e.g., `#8E8E93` or `#9CA3AF`) for dates, subtitles, and inactive tab icons.
*   **Accents & Semantics:**
    *   **Positive/Income:** Vibrant green for text and icons, paired with a very pale, transparent green background for the containing circle/pill.
    *   **Negative/Expense:** Orange/Amber for the "Expense" summary pill, and standard black for transaction amounts (with a negative sign). The chart tooltip features a red-to-orange gradient line.
    *   **Primary Action (FAB):** Dark charcoal/black to match the balance card, making it a prominent anchor at the bottom of the screen.

## 2. Typography

*   **Font Family:** A clean, modern sans-serif (e.g., Inter, SF Pro Display, or Roboto).
*   **Hierarchy:**
    *   **Hero/Balances:** Extremely large, bold weight (e.g., 32pt+).
    *   **Headers/Titles:** Large, bold (e.g., "Transactions", "Statistics", "Top Spending").
    *   **List Item Names:** Medium size, semi-bold/bold.
    *   **Subtitles/Dates:** Smaller size, regular weight, always in the muted gray color.

## 3. UI Components & Shapes

*   **Border Radius (Corners):** This is a defining characteristic. Everything is heavily rounded.
    *   **Cards:** Large border radii (approx 24px - 32px), creating smooth, pebble-like shapes.
    *   **Icons & Buttons:** Perfect circles or fully rounded pill shapes.
*   **Shadows (Elevation):**
    *   White cards feature a very soft, diffused, large-spread drop shadow. This creates a subtle "floating" effect rather than a harsh border.
    *   The main dark balance card has a darker, more pronounced shadow underneath it.
*   **Icons:**
    *   **List Icons:** Brand logos or simple vector icons are placed squarely inside a perfectly circular background. The background color of this circle is often a very faint, 10-15% opacity version of the icon's dominant color.
    *   **System Icons:** Minimalist, stroke-based outlines (back arrow, share, bell, tab icons).

## 4. Specific Screen Breakdowns

### Dashboard (Home) Screen
*   **Header:** Personalized greeting with a small "Good Morning!" subtitle above the bolded user name. A circular notification bell sits to the right.
*   **Balance Card (The Focal Point):** Dark, premium feel. Contains total balance, a subtle gradient progress/limit bar, masked card details, and a Mastercard logo. It anchors the top of the screen.
*   **Summary Pills (Income/Expense):** Two side-by-side pill-shaped cards providing quick percentage stats. They use colored text and matching pale background circles for their respective icons.
*   **Transactions List:** Stacked white cards. Each row contains a rounded icon, Title, Date (below title), and the Amount pushed to the far right edge.
*   **Bottom Navigation:** A standard white bar with muted, unselected icons. The center features a large, floating dark circular button with a "+" icon for quick addition.

### Statistics Screen
*   **Header:** Simple navigation with a back arrow and a share/export action.
*   **Hero Stat:** The total amount is centered and massive, with the specific date centered below it.
*   **Segmented Control:** A pill-shaped container with three options (Week, Month, Year). The active state is a dark pill that fully encompasses the text, sliding between options.
*   **Chart:** A smooth, curved spline line chart (no sharp angles). It features an interactive tooltip showing a specific point's value and a dashed vertical line dropping down to the bolded X-axis label. The line itself fades out slightly towards the edges.
*   **Top Spending:** A list layout identical to the Transactions list on the home screen, maintaining consistency.

## 5. Key Design Takeaways for Implementation

To replicate this in a codebase, focus on:
1.  **Removing harsh borders:** Rely on soft shadows and off-white backgrounds to separate white cards.
2.  **Maximizing Border Radius:** Use `rounded-2xl`, `rounded-[32px]`, or `rounded-full` extensively.
3.  **Consistent Spacing:** Use large gaps (e.g., 16px to 24px) between distinct sections.
4.  **Icon Enclosures:** Always wrap list icons in a softly colored, circular view.
5.  **Font Weights:** Use stark contrasts in font weights (bold for primary data, regular for metadata) rather than just size differences.
