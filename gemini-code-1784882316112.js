const uploadView = {
    render: function() {
        return `
            <h2>Tải tài liệu lên hệ thống</h2>
            <div style="border: 1px dashed #34495e; padding: 20px; border-radius: 8px; text-align: center; background-color: #f9f9f9;">
                <p>Hỗ trợ định dạng Word (.doc, .docx) cho bài viết và Audio (.mp3, .wav) cho bài nói.</p>
                
                <!-- Input chọn file với thuộc tính accept giới hạn định dạng -->
                <input type="file" id="file-upload" accept=".doc,.docx,audio/mp3,audio/wav,audio/*" style="margin-bottom: 15px;" />
                <br>
                
                <button onclick="uploadView.handleUpload()" style="padding: 8px 20px; cursor: pointer; background-color: #2980b9; color: white; border: none; border-radius: 4px;">
                    Tải lên ngay
                </button>
                
                <p id="upload-status" style="margin-top: 15px; font-weight: bold;"></p>
            </div>
        `;
    },

    handleUpload: function() {
        const fileInput = document.getElementById('file-upload');
        const statusText = document.getElementById('upload-status');
        
        // Kiểm tra xem người dùng đã chọn file chưa
        if (fileInput.files.length === 0) {
            statusText.textContent = "⚠️ Vui lòng chọn một file trước khi tải lên!";
            statusText.style.color = "red";
            return;
        }

        const file = fileInput.files[0];
        const fileName = file.name;
        
        // Lấy đuôi file (extension) để kiểm tra
        const fileExt = fileName.split('.').pop().toLowerCase();
        const allowedExtensions = ['doc', 'docx', 'mp3', 'wav', 'm4a'];

        if (!allowedExtensions.includes(fileExt)) {
            statusText.textContent = "❌ Định dạng file không hợp lệ! Vui lòng chỉ tải lên file Word hoặc Audio.";
            statusText.style.color = "red";
            return;
        }

        // Giả lập quá trình tải lên (hiển thị trạng thái đang xử lý)
        statusText.textContent = `⏳ Đang tải lên file "${fileName}"...`;
        statusText.style.color = "#f39c12"; // Màu cam

        // Dùng setTimeout để giả lập độ trễ của mạng
        setTimeout(() => {
            statusText.textContent = `✅ Tải lên thành công: ${fileName}. AI đang tiến hành phân tích!`;
            statusText.style.color = "green";
            
            // Xóa file khỏi input sau khi tải xong (tùy chọn)
            fileInput.value = "";
        }, 1500); // Đợi 1.5 giây
    }
};