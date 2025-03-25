// components/LoadingModal.tsx
export default function LoadingModal() {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[80]">
        <div className="bg-white dark:bg-[#0F0F12] p-6 rounded-md shadow-lg text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-gray-100 mx-auto"></div>
          <p className="mt-4 text-lg font-medium text-gray-900 dark:text-white">Loading, please wait...</p>
        </div>
      </div>
    );
  }