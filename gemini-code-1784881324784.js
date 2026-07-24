// Khởi tạo đối tượng ứng dụng chính
const app = {
    init: function() {
        console.log("IELTS Learner Copilot đang khởi động...");
        // Khởi tạo các mô-đun
        if (typeof store !== 'undefined') store.init();
        if (typeof ai !== 'undefined') ai.init();
    },

    // Hàm điều hướng đơn giản (Router)
    navigateTo: function(viewName) {
        const contentArea = document.getElementById('app-content');
        
        switch(viewName) {
            case 'skills':
                contentArea.innerHTML = skillsView.render();
                break;
            case 'grammar':
                contentArea.innerHTML = grammar.render();
                break;
            case 'library':
                contentArea.innerHTML = libraryView.render();
                break;
            default:
                contentArea.innerHTML = `<h2>Lỗi 404</h2><p>Không tìm thấy trang.</p>`;
        }
    }
};

// Khởi chạy ứng dụng khi DOM tải xong
document.addEventListener('DOMContentLoaded', app.init);