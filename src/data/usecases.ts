/**
 * Usecases Data
 * 
 * Danh sách các usecase của hệ thống
 */

export interface Usecase {
  id: string;
  title: string;
  description: string;
  category: string;
  actor: string;
  preconditions: string[];
  steps: string[];
  postconditions: string[];
  alternativeFlows?: string[];
  exceptionFlows?: string[];
  relatedAPIs?: string[];
  priority: 'high' | 'medium' | 'low';
  status: 'completed' | 'in-progress' | 'planned';
}

export const usecases: Usecase[] = [
  {
    id: 'UC001',
    title: 'Đăng nhập hệ thống',
    description: 'Người dùng đăng nhập vào hệ thống bằng email và mật khẩu',
    category: 'Authentication',
    actor: 'Người dùng',
    priority: 'high',
    status: 'completed',
    preconditions: [
      'Người dùng đã có tài khoản trong hệ thống',
      'Người dùng chưa đăng nhập',
      'Hệ thống đang hoạt động bình thường'
    ],
    steps: [
      'Người dùng truy cập trang đăng nhập',
      'Người dùng nhập email và mật khẩu',
      'Người dùng nhấn nút "Đăng nhập"',
      'Hệ thống xác thực thông tin đăng nhập',
      'Hệ thống tạo JWT token',
      'Hệ thống chuyển hướng người dùng đến trang Dashboard'
    ],
    postconditions: [
      'Người dùng đã đăng nhập thành công',
      'JWT token được lưu trong localStorage',
      'Session được khởi tạo'
    ],
    alternativeFlows: [
      'Nếu email không tồn tại, hiển thị thông báo "Email không tồn tại"',
      'Nếu mật khẩu sai, hiển thị thông báo "Mật khẩu không đúng"',
      'Nếu tài khoản bị khóa, hiển thị thông báo "Tài khoản đã bị khóa"'
    ],
    exceptionFlows: [
      'Nếu server không phản hồi, hiển thị thông báo lỗi mạng',
      'Nếu JWT token không được tạo, hiển thị thông báo lỗi hệ thống'
    ],
    relatedAPIs: [
      'POST /api/auth/login',
      'POST /api/auth/refresh-token'
    ]
  },
  {
    id: 'UC002',
    title: 'Đăng ký tài khoản mới',
    description: 'Người dùng tạo tài khoản mới trong hệ thống',
    category: 'Authentication',
    actor: 'Người dùng mới',
    priority: 'high',
    status: 'completed',
    preconditions: [
      'Người dùng chưa có tài khoản',
      'Email chưa được sử dụng',
      'Hệ thống cho phép đăng ký mới'
    ],
    steps: [
      'Người dùng truy cập trang đăng ký',
      'Người dùng nhập thông tin: email, tên, mật khẩu',
      'Người dùng xác nhận mật khẩu',
      'Người dùng nhấn nút "Đăng ký"',
      'Hệ thống validate thông tin',
      'Hệ thống tạo tài khoản mới',
      'Hệ thống gửi email xác thực',
      'Hệ thống chuyển hướng đến trang xác thực email'
    ],
    postconditions: [
      'Tài khoản mới được tạo trong database',
      'Email xác thực được gửi',
      'Người dùng nhận được thông báo đăng ký thành công'
    ],
    alternativeFlows: [
      'Nếu email đã tồn tại, hiển thị thông báo "Email đã được sử dụng"',
      'Nếu mật khẩu không đủ mạnh, hiển thị thông báo yêu cầu',
      'Nếu xác nhận mật khẩu không khớp, hiển thị thông báo lỗi'
    ],
    exceptionFlows: [
      'Nếu gửi email thất bại, lưu lại để gửi sau',
      'Nếu tạo tài khoản thất bại, rollback transaction'
    ],
    relatedAPIs: [
      'POST /api/auth/register',
      'POST /api/auth/verify-email'
    ]
  },
  {
    id: 'UC003',
    title: 'Quản lý hồ sơ người dùng',
    description: 'Người dùng xem và cập nhật thông tin cá nhân',
    category: 'User Management',
    actor: 'Người dùng đã đăng nhập',
    priority: 'medium',
    status: 'completed',
    preconditions: [
      'Người dùng đã đăng nhập',
      'Người dùng có quyền truy cập trang hồ sơ'
    ],
    steps: [
      'Người dùng truy cập trang Profile',
      'Hệ thống hiển thị thông tin hiện tại',
      'Người dùng chỉnh sửa thông tin cần thiết',
      'Người dùng nhấn nút "Lưu thay đổi"',
      'Hệ thống validate dữ liệu',
      'Hệ thống cập nhật thông tin',
      'Hệ thống hiển thị thông báo thành công'
    ],
    postconditions: [
      'Thông tin người dùng được cập nhật trong database',
      'Cache được cập nhật',
      'Người dùng nhận thông báo thành công'
    ],
    alternativeFlows: [
      'Nếu email mới đã tồn tại, hiển thị thông báo lỗi',
      'Nếu số điện thoại không hợp lệ, hiển thị thông báo lỗi'
    ],
    relatedAPIs: [
      'GET /api/users/profile',
      'PUT /api/users/profile',
      'PATCH /api/users/avatar'
    ]
  },
  {
    id: 'UC004',
    title: 'Thay đổi mật khẩu',
    description: 'Người dùng thay đổi mật khẩu đăng nhập',
    category: 'Security',
    actor: 'Người dùng đã đăng nhập',
    priority: 'high',
    status: 'completed',
    preconditions: [
      'Người dùng đã đăng nhập',
      'Người dùng biết mật khẩu hiện tại'
    ],
    steps: [
      'Người dùng truy cập trang Security Settings',
      'Người dùng nhập mật khẩu hiện tại',
      'Người dùng nhập mật khẩu mới',
      'Người dùng xác nhận mật khẩu mới',
      'Người dùng nhấn nút "Đổi mật khẩu"',
      'Hệ thống xác thực mật khẩu hiện tại',
      'Hệ thống validate mật khẩu mới',
      'Hệ thống cập nhật mật khẩu',
      'Hệ thống gửi email thông báo'
    ],
    postconditions: [
      'Mật khẩu được cập nhật trong database',
      'Email thông báo được gửi',
      'Các session cũ bị hủy (tùy chọn)'
    ],
    alternativeFlows: [
      'Nếu mật khẩu hiện tại sai, hiển thị thông báo lỗi',
      'Nếu mật khẩu mới không đủ mạnh, hiển thị yêu cầu'
    ],
    relatedAPIs: [
      'POST /api/users/change-password',
      'POST /api/auth/logout-all-sessions'
    ]
  },
  {
    id: 'UC005',
    title: 'Quản lý người dùng (Admin)',
    description: 'Admin quản lý danh sách người dùng trong hệ thống',
    category: 'Administration',
    actor: 'Administrator',
    priority: 'high',
    status: 'completed',
    preconditions: [
      'Admin đã đăng nhập',
      'Admin có quyền quản lý người dùng'
    ],
    steps: [
      'Admin truy cập trang User Management',
      'Hệ thống hiển thị danh sách người dùng',
      'Admin có thể: tìm kiếm, lọc, sắp xếp',
      'Admin chọn người dùng để xem chi tiết',
      'Admin có thể: sửa thông tin, khóa/mở khóa, xóa tài khoản',
      'Hệ thống thực hiện hành động',
      'Hệ thống ghi log audit'
    ],
    postconditions: [
      'Thay đổi được lưu trong database',
      'Log audit được ghi nhận',
      'Notification được gửi (nếu cần)'
    ],
    alternativeFlows: [
      'Nếu không tìm thấy người dùng, hiển thị thông báo',
      'Nếu không có quyền, hiển thị thông báo lỗi quyền truy cập'
    ],
    relatedAPIs: [
      'GET /api/users',
      'GET /api/users/:id',
      'PUT /api/users/:id',
      'DELETE /api/users/:id',
      'POST /api/users/:id/lock'
    ]
  },
  {
    id: 'UC006',
    title: 'Xem tài liệu API',
    description: 'Developer xem tài liệu API của hệ thống',
    category: 'Documentation',
    actor: 'Developer',
    priority: 'medium',
    status: 'completed',
    preconditions: [
      'Developer đã đăng nhập',
      'API documentation được cập nhật'
    ],
    steps: [
      'Developer truy cập trang Dev Docs',
      'Hệ thống hiển thị danh sách API endpoints',
      'Developer có thể tìm kiếm và lọc theo tag',
      'Developer chọn endpoint để xem chi tiết',
      'Hệ thống hiển thị: request/response schema, examples, authentication',
      'Developer có thể copy code examples'
    ],
    postconditions: [
      'Developer hiểu cách sử dụng API',
      'Developer có thể tích hợp API'
    ],
    relatedAPIs: [
      'GET /api/docs/openapi.json'
    ]
  },
  {
    id: 'UC007',
    title: 'Export dữ liệu',
    description: 'Người dùng export dữ liệu ra file Excel/CSV',
    category: 'Data Management',
    actor: 'Người dùng đã đăng nhập',
    priority: 'medium',
    status: 'in-progress',
    preconditions: [
      'Người dùng có quyền export',
      'Có dữ liệu để export'
    ],
    steps: [
      'Người dùng chọn dữ liệu cần export',
      'Người dùng chọn định dạng (Excel/CSV)',
      'Người dùng nhấn nút "Export"',
      'Hệ thống tạo file',
      'Hệ thống tự động download file'
    ],
    postconditions: [
      'File được tạo thành công',
      'File được download về máy người dùng'
    ],
    relatedAPIs: [
      'POST /api/export/users',
      'POST /api/export/data'
    ]
  },
  {
    id: 'UC008',
    title: 'Thay đổi ngôn ngữ giao diện',
    description: 'Người dùng thay đổi ngôn ngữ hiển thị của ứng dụng',
    category: 'Localization',
    actor: 'Người dùng',
    priority: 'low',
    status: 'completed',
    preconditions: [
      'Ứng dụng hỗ trợ nhiều ngôn ngữ',
      'Người dùng đang sử dụng ứng dụng'
    ],
    steps: [
      'Người dùng click vào dropdown ngôn ngữ',
      'Hệ thống hiển thị danh sách ngôn ngữ: VI, EN, ES, ZH, JA, KO',
      'Người dùng chọn ngôn ngữ mong muốn',
      'Hệ thống thay đổi ngôn ngữ tất cả text trong UI',
      'Hệ thống lưu preference vào localStorage'
    ],
    postconditions: [
      'Giao diện hiển thị đúng ngôn ngữ',
      'Preference được lưu để lần sau'
    ]
  },
  {
    id: 'UC009',
    title: 'Thay đổi theme (Dark/Light)',
    description: 'Người dùng chuyển đổi giữa Dark mode và Light mode',
    category: 'Appearance',
    actor: 'Người dùng',
    priority: 'low',
    status: 'completed',
    preconditions: [
      'Ứng dụng hỗ trợ cả Dark và Light theme',
      'Người dùng đang sử dụng ứng dụng'
    ],
    steps: [
      'Người dùng click vào toggle theme button',
      'Hệ thống chuyển đổi theme',
      'Hệ thống cập nhật CSS classes',
      'Hệ thống lưu preference vào localStorage'
    ],
    postconditions: [
      'Theme được thay đổi',
      'Preference được lưu'
    ]
  },
  {
    id: 'UC010',
    title: 'Tìm kiếm và lọc dữ liệu',
    description: 'Người dùng tìm kiếm và lọc dữ liệu trong bảng',
    category: 'Data Management',
    actor: 'Người dùng đã đăng nhập',
    priority: 'medium',
    status: 'completed',
    preconditions: [
      'Người dùng có quyền xem dữ liệu',
      'Có dữ liệu trong hệ thống'
    ],
    steps: [
      'Người dùng nhập từ khóa vào ô tìm kiếm',
      'Hệ thống filter dữ liệu theo từ khóa',
      'Người dùng chọn filter theo category/status',
      'Hệ thống cập nhật kết quả',
      'Người dùng có thể sắp xếp theo cột'
    ],
    postconditions: [
      'Dữ liệu được hiển thị theo điều kiện',
      'Filter state được lưu trong URL'
    ]
  }
];

export const usecaseCategories = [
  'Authentication',
  'User Management',
  'Security',
  'Administration',
  'Documentation',
  'Data Management',
  'Localization',
  'Appearance'
];

export const usecaseStatuses = [
  { value: 'completed', label: 'Completed', color: 'bg-green-500' },
  { value: 'in-progress', label: 'In Progress', color: 'bg-yellow-500' },
  { value: 'planned', label: 'Planned', color: 'bg-gray-500' }
];

export const usecasePriorities = [
  { value: 'high', label: 'High', color: 'bg-red-500' },
  { value: 'medium', label: 'Medium', color: 'bg-yellow-500' },
  { value: 'low', label: 'Low', color: 'bg-blue-500' }
];
