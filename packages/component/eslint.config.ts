import { rentonReact } from "@renton/eslint-config-react";

export default rentonReact({
  stylistic: {
    quotes: "double",
    semi: true,
  },
}, {
  rules: {
    "react/naming-convention-ref-name": "off",
  },
});
