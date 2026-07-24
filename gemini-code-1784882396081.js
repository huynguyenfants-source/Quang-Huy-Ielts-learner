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
            // Thêm case upload vào đây
            case 'upload':
                contentArea.innerHTML = uploadView.render();
                break;
            default:
                contentArea.innerHTML = `<h2>Lỗi 404</h2><p>Không tìm thấy trang.</p>`;
        }
    }