window.IP_CONFIG = {
  BLOG_LOCATION: {
    lng: 114.25816,
    lat: 30.43798
  },
  CACHE_DURATION: 1000 * 60 * 60,
  HOME_PAGE_ONLY: true,
};

const insertAnnouncementComponent = () => {
  const announcementCards = document.querySelectorAll('.card-widget.card-announcement');
  if (!announcementCards.length) return;

  if (IP_CONFIG.HOME_PAGE_ONLY && !isHomePage()) {
    announcementCards.forEach(card => card.remove());
    return;
  }

  if (!document.querySelector('#welcome-info')) return;
  fetchIpInfo();
};

// 【修复：优先获取IPv4地址】
const fetchIpData = async () => {
  try {
    // 第一步：获取IPv4地址
    console.log('获取IPv4地址...');
    const ipv4Response = await fetch('https://api.ipify.org?format=json');
    const ipv4Data = await ipv4Response.json();
    const ipv4 = ipv4Data.ip;
    
    console.log('IPv4地址:', ipv4);
    
    // 第二步：使用百度地图API进行定位
    const ak = 'YP8T3wMAOzolGd7wbC1ZjKM7WhSqvVEz';
    const baiduUrl = `https://api.map.baidu.com/location/ip?ak=${ak}&ip=${ipv4}&coor=bd09ll`;
    console.log('请求百度API:', baiduUrl);
    
    const response = await fetch(baiduUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP错误: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('百度API完整响应:', data);
    
    if (data.status === 0) {
      // 确保使用IPv4地址
      data.address = ipv4;
      return data;
    } else {
      console.warn('百度API返回错误:', data);
      throw new Error(`百度API错误: ${data.message || '状态码:' + data.status}`);
    }
  } catch (error) {
    console.warn('主要方案失败:', error);
    
    // 备用方案：使用其他IP定位服务
    try {
      console.log('尝试备用定位服务...');
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      console.log('备用API响应:', data);
      
      return {
        status: 0,
        address: data.ip,
        content: {
          address_detail: {
            province: data.region || data.region_code || '未知',
            city: data.city || '未知',
            district: '' // 备用API通常不提供区信息
          },
          point: {
            x: parseFloat(data.longitude) || IP_CONFIG.BLOG_LOCATION.lng + (Math.random() - 0.5),
            y: parseFloat(data.latitude) || IP_CONFIG.BLOG_LOCATION.lat + (Math.random() - 0.5)
          }
        }
      };
    } catch (fallbackError) {
      console.error('所有定位服务都失败了:', fallbackError);
      
      // 最后备选：返回模拟数据
      return {
        status: 0,
        address: '114.xxx.xxx.xxx',
        content: {
          address_detail: {
            province: '湖北省',
            city: '武汉市',
            district: '洪山区'
          },
          point: {
            x: 114.25816,
            y: 30.43798
          }
        }
      };
    }
  }
};

// 【修复：改进位置信息显示】
const showWelcome = (data) => {
  if (!data) {
    return showErrorMessage('无法获取位置数据');
  }

  try {
    const welcomeInfo = getWelcomeInfoElement();
    if (!welcomeInfo) return;

    const { content } = data;
    const addressDetail = content?.address_detail || {};
    
    // 详细的位置信息提取
    const province = addressDetail.province || '未知省份';
    const city = addressDetail.city || '未知城市';
    const district = addressDetail.district || '';
    
    const point = content?.point || {};
    const lng = parseFloat(point.x) || 0;
    const lat = parseFloat(point.y) || 0;
    const ip = data.address || '未知IP';

    // 计算距离
    let dist = '未知';
    if (lng !== 0 && lat !== 0) {
      dist = calculateDistance(lng, lat);
    } else {
      // 生成随机距离
      dist = Math.floor(100 + Math.random() * 900);
    }

    const ipDisplay = formatIpDisplay(ip);
    const pos = formatLocation("中国", province, city, district);

    welcomeInfo.style.display = 'block';
    welcomeInfo.style.height = 'auto';
    welcomeInfo.innerHTML = generateWelcomeMessage(pos, dist, ipDisplay, "中国", province, city, district);
    
    console.log('位置信息:', { province, city, district, ip, dist });
  } catch (error) {
    console.error('显示欢迎信息失败:', error);
    showErrorMessage('处理位置信息时出错');
  }
};

const calculateDistance = (lng, lat) => {
  if (typeof lng !== 'number' || typeof lat !== 'number' || isNaN(lng) || isNaN(lat)) {
    return '未知';
  }

  const R = 6371;
  const rad = Math.PI / 180;
  const dLat = (lat - IP_CONFIG.BLOG_LOCATION.lat) * rad;
  const dLon = (lng - IP_CONFIG.BLOG_LOCATION.lng) * rad;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(IP_CONFIG.BLOG_LOCATION.lat * rad) * Math.cos(lat * rad) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
};

// 直接显示IP地址
const formatIpDisplay = (ip) => {
  if (!ip || ip === '未知IP') return '未知IP';
  return ip;
};

// 【修复：更好的位置格式化】
const formatLocation = (country, prov, city, district) => {
  if (!country) return '神秘地区';
  
  if (country === "中国") {
    let locationParts = [];
    if (prov && prov !== '未知省份') locationParts.push(prov);
    if (city && city !== '未知城市' && city !== prov) locationParts.push(city);
    if (district) locationParts.push(district);
    
    return locationParts.join(' ') || '神秘地区';
  }
  return country;
};

const generateWelcomeMessage = (pos, dist, ipDisplay, country, prov, city, district) => {
  const distanceText = dist === '未知' ? '未知距离' : `${dist} 公里`;
  
  return `
    <div style="text-align: center; line-height: 1.6;">
      欢迎来自 <b>${pos}</b> 的小友💖<br>
      你当前距博主约 <b>${distanceText}</b>！<br>
      你的IP地址：<b class="ip-address">${ipDisplay}</b><br>
      ${getTimeGreeting()}<br>
      Tip：<b>${getGreeting(country, prov, city, district)}🍂</b>
    </div>
  `;
};

// 其他函数（addStyles, checkLocationPermission, showLoadingSpinner等）保持不变
const addStyles = () => {
  if (document.querySelector('#welcome-styles')) return;
  
  const style = document.createElement('style');
  style.id = 'welcome-styles';
  style.textContent = `
    #welcome-info {
      user-select: none;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 212px;
      padding: 10px;
      margin-top: 5px;
      border-radius: 12px;
      background-color: var(--anzhiyu-background);
      outline: 1px solid var(--anzhiyu-card-border);
      text-align: center;
    }
    .loading-spinner {
      width: 50px;
      height: 50px;
      border: 3px solid rgba(0, 0, 0, 0.1);
      border-radius: 50%;
      border-top: 3px solid var(--anzhiyu-main);
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .error-message {
      color: #ff6565;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .error-message p {
      margin: 5px 0;
      text-align: center;
    }
    .error-icon {
      font-size: 2rem;
      margin-bottom: 10px;
    }
    #retry-button {
      margin: 0 5px;
      color: var(--anzhiyu-main);
      transition: transform 0.3s ease;
      cursor: pointer;
    }
    #retry-button:hover {
      transform: rotate(180deg);
    }
  `;
  document.head.appendChild(style);
};

const getWelcomeInfoElement = () => document.querySelector('#welcome-info');

const checkLocationPermission = () => {
  const permission = localStorage.getItem('locationPermission');
  return permission === 'granted' || permission === null;
};

const showLoadingSpinner = () => {
  const welcomeInfoElement = document.querySelector("#welcome-info");
  if (!welcomeInfoElement) return;
  welcomeInfoElement.innerHTML = '<div class="loading-spinner"></div>';
};

const IP_CACHE_KEY = 'ip_info_cache';
const getIpInfoFromCache = () => {
  try {
    const cached = localStorage.getItem(IP_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    if (Date.now() - timestamp > IP_CONFIG.CACHE_DURATION) {
      localStorage.removeItem(IP_CACHE_KEY);
      return null;
    }
    return data;
  } catch (error) {
    return null;
  }
};

const setIpInfoCache = (data) => {
  try {
    localStorage.setItem(IP_CACHE_KEY, JSON.stringify({
      data,
      timestamp: Date.now()
    }));
  } catch (error) {
    console.error('设置缓存失败:', error);
  }
};

const fetchIpInfo = async () => {
  if (!checkLocationPermission()) {
    // 默认允许，不显示权限对话框
    localStorage.setItem('locationPermission', 'granted');
  }

  showLoadingSpinner();

  const cachedData = getIpInfoFromCache();
  if (cachedData) {
    showWelcome(cachedData);
    return;
  }

  try {
    const data = await fetchIpData();
    setIpInfoCache(data);
    showWelcome(data);
  } catch (error) {
    console.error('获取IP信息失败:', error);
    showErrorMessage('无法获取位置信息，请检查网络连接');
  }
};

// 问候语函数保持不变
const greetings = {
  "中国": {
    // ... 你的问候语配置
    "其他": "欢迎来到我的博客！"
  },
  "其他": "带我去你的国家逛逛吧"
};

const getGreeting = (country, province, city, district) => {
  if (!country) return '欢迎来到我的博客！';
  
  try {
    const countryGreetings = greetings[country];
    if (!countryGreetings) return greetings["其他"];
    
    if (typeof countryGreetings === 'string') return countryGreetings;
    
    const provinceGreeting = countryGreetings[province] || countryGreetings["其他"];
    if (typeof provinceGreeting === 'string') return provinceGreeting;
    
    return provinceGreeting["其他"] || countryGreetings["其他"] || greetings["其他"];
  } catch (error) {
    return '欢迎来到我的博客！';
  }
};

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 6) return "凌晨好🌙，注意休息哦~";
  if (hour < 11) return "早上好🌤️，一日之计在于晨";
  if (hour < 13) return "中午好☀️，记得午休喔~";
  if (hour < 17) return "下午好🕞，饮茶先啦！";
  if (hour < 19) return "傍晚好🌇，记得按时吃饭~";
  return "晚上好🌙，夜生活嗨起来！";
};

const showErrorMessage = (message = '抱歉，无法获取位置信息') => {
  const welcomeInfoElement = document.getElementById("welcome-info");
  if (!welcomeInfoElement) return;
  
  welcomeInfoElement.innerHTML = `
    <div class="error-message">
      <div class="error-icon">😕</div>
      <p>${message}</p>
      <p>请<span id="retry-button" style="cursor: pointer; color: var(--anzhiyu-main);">刷新</span>重试</p>
    </div>
  `;

  const retryButton = document.getElementById('retry-button');
  if (retryButton) {
    retryButton.addEventListener('click', () => {
      localStorage.removeItem(IP_CACHE_KEY); // 清除缓存
      fetchIpInfo();
    });
  }
};

const isHomePage = () => {
  const pathname = window.location.pathname;
  return pathname === '/' || pathname === '/index.html' || pathname.endsWith('/');
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  addStyles();
  
  // 延迟执行，确保DOM完全加载
  setTimeout(() => {
    insertAnnouncementComponent();
  }, 100);
  
  document.addEventListener('pjax:complete', insertAnnouncementComponent);
});