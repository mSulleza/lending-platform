"use client";

import { useState } from "react";

export const Counter = () => {
  const [count, setCount] = useState(0);

  return (
    <button
      onClick={() => setCount(count + 1)}
      className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white bg-primary rounded-full hover:bg-primary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-colors"
    >
      Count is {count}
    </button>
  );
};
