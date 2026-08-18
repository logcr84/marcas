import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  // Determinar qué páginas mostrar (máximo 5 botones numerados)
  const getPages = () => {
    let start = Math.max(1, currentPage - 2);
    let end = Math.min(totalPages, start + 4);

    if (end - start < 4) {
      start = Math.max(1, end - 4);
    }

    const pages = [];
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPages();

  return (
    <div className="pagination-container">
      <button
        className="btn-pagination"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
        title="Página anterior"
      >
        <ChevronLeft size={16} />
      </button>

      {pages[0] > 1 && (
        <>
          <button className="btn-pagination" onClick={() => onPageChange(1)}>1</button>
          {pages[0] > 2 && <span className="pagination-ellipsis">...</span>}
        </>
      )}

      {pages.map(page => (
        <button
          key={page}
          className={`btn-pagination ${currentPage === page ? 'active' : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="pagination-ellipsis">...</span>}
          <button className="btn-pagination" onClick={() => onPageChange(totalPages)}>{totalPages}</button>
        </>
      )}

      <button
        className="btn-pagination"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
        title="Página siguiente"
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
