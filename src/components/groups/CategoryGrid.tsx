
import React from "react";

interface CategoryGridProps {
  categories: string[];
  onSelectCategory: (category: string) => void;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, onSelectCategory }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {categories.map(category => (
        <button
          key={category}
          className="bg-zinc-900 hover:bg-zinc-700 p-4 rounded-lg text-center transition-colors"
          onClick={() => onSelectCategory(category)}
        >
          {category}
        </button>
      ))}
    </div>
  );
};
