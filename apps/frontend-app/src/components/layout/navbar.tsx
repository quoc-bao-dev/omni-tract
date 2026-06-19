import Image from 'next/image';
import { DeleteButton } from '@/features/content-delete';
import { FilterButton } from '@/features/content-filter';
import { ImportButton } from '@/features/content-import';
import { RefreshButton } from '@/features/content-refresh';
import { ExportButton } from '@/features/data-export';
import { SettingsButton } from '@/features/settings';

/** Navbar (Figma 108:5753): logo trái, các action phải; border-b, px-240 py-12. */
export function Navbar() {
  return (
    <header className="sticky top-0 z-30 border-border border-b bg-surface">
      <div className="mx-auto flex max-w-[1440px] items-center gap-2 px-6 py-3">
        <div className="flex flex-1 items-center gap-1">
          <Image
            src="/brand/omnitract-mark.svg"
            alt=""
            width={24}
            height={24}
            priority
          />
          <span className="font-semibold text-lg text-text-primary tracking-tight">OmniTract</span>
        </div>

        <DeleteButton />
        <RefreshButton />
        <FilterButton />
        <SettingsButton />
        <ExportButton />
        <ImportButton />
      </div>
    </header>
  );
}
