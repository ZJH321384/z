// 试卷爬虫 - 自动搜索和下载真题试卷
const https = require('https');
const http = require('http');
const cheerio = require('cheerio');
const { URL } = require('url');
const fs = require('fs');
const path = require('path');

// 用户代理列表
const userAgents = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15'
];

// 获取随机用户代理
function getRandomUserAgent() {
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}

// HTTP 请求封装
function request(url, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const defaultOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      },
      timeout: 30000
    };
    
    const reqOptions = { ...defaultOptions, ...options };
    
    const req = client.request(reqOptions, (res) => {
      let data = '';
      
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        request(redirectUrl, options).then(resolve).catch(reject);
        return;
      }
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// 教育资源网站爬虫配置
const crawlerConfigs = {
  // 百度搜索引擎
  baidu: {
    name: '百度搜索',
    searchUrl: (keyword) => `https://www.baidu.com/s?wd=${encodeURIComponent(keyword)}`,
    parseResults: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      
      $('.result').each((i, elem) => {
        const title = $(elem).find('.t a').text().trim();
        const url = $(elem).find('.t a').attr('href');
        const abstract = $(elem).find('.content-right_8Zs40').text().trim() || 
                        $(elem).find('.c-abstract').text().trim();
        
        if (title && url) {
          results.push({
            title,
            url,
            abstract,
            source: '百度搜索'
          });
        }
      });
      
      return results;
    }
  },
  
  // Bing 搜索引擎
  bing: {
    name: 'Bing搜索',
    searchUrl: (keyword) => `https://www.bing.com/search?q=${encodeURIComponent(keyword)}`,
    parseResults: (html) => {
      const $ = cheerio.load(html);
      const results = [];
      
      $('.b_algo').each((i, elem) => {
        const title = $(elem).find('h2 a').text().trim();
        const url = $(elem).find('h2 a').attr('href');
        const abstract = $(elem).find('.b_caption p').text().trim();
        
        if (title && url) {
          results.push({
            title,
            url,
            abstract,
            source: 'Bing搜索'
          });
        }
      });
      
      return results;
    }
  }
};

// 搜索试卷
async function searchPapersWithCrawler(examType, province, subject, year, options = {}) {
  const { 
    engines = ['baidu', 'bing'], 
    maxResults = 10,
    timeout = 30000 
  } = options;
  
  // 生成搜索关键词
  const keywords = [
    `${year}年${province}${examType}${subject}真题`,
    `${year} ${province} ${subject} ${examType} 试卷 PDF`,
    `${province}${year}年${subject}${examType}试题及答案`,
    `${year}年${subject}${examType}真题下载`
  ];
  
  const allResults = [];
  
  for (const keyword of keywords) {
    for (const engineName of engines) {
      try {
        const config = crawlerConfigs[engineName];
        if (!config) continue;
        
        console.log(`使用 ${config.name} 搜索: ${keyword}`);
        
        const searchUrl = config.searchUrl(keyword);
        const response = await request(searchUrl, { timeout });
        
        if (response.statusCode === 200) {
          const results = config.parseResults(response.body);
          
          // 过滤和评分结果
          const scoredResults = results.map(r => {
            let score = 0;
            
            // 标题匹配度
            if (r.title.includes(year)) score += 10;
            if (r.title.includes(province)) score += 10;
            if (r.title.includes(subject)) score += 10;
            if (r.title.includes(examType)) score += 10;
            if (r.title.includes('真题')) score += 5;
            if (r.title.includes('试卷')) score += 5;
            
            // 文件类型偏好
            if (r.url.includes('.pdf')) score += 15;
            if (r.url.includes('.doc') || r.url.includes('.docx')) score += 10;
            
            // 来源可信度
            if (['学科网', '高考资源网', '菁优网'].includes(r.source)) score += 10;
            
            return { ...r, score };
          });
          
          // 按分数排序并添加到结果
          scoredResults
            .sort((a, b) => b.score - a.score)
            .slice(0, maxResults)
            .forEach(r => {
              // 去重
              if (!allResults.find(existing => existing.url === r.url)) {
                allResults.push(r);
              }
            });
        }
        
        // 延迟避免被封
        await delay(1000 + Math.random() * 2000);
        
      } catch (error) {
        console.error(`${engineName} 搜索失败:`, error.message);
      }
    }
  }
  
  // 最终排序
  return allResults.sort((a, b) => b.score - a.score).slice(0, maxResults);
}

// 下载文件
async function downloadFile(url, savePath, options = {}) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === 'https:' ? https : http;
    
    const reqOptions = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      method: 'GET',
      headers: {
        'User-Agent': getRandomUserAgent(),
        'Accept': 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,*/*',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Referer': parsedUrl.origin
      },
      timeout: options.timeout || 60000
    };
    
    const req = client.request(reqOptions, (res) => {
      // 处理重定向
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const redirectUrl = new URL(res.headers.location, url).toString();
        downloadFile(redirectUrl, savePath, options).then(resolve).catch(reject);
        return;
      }
      
      if (res.statusCode !== 200) {
        reject(new Error(`Download failed with status ${res.statusCode}`));
        return;
      }
      
      // 获取文件大小
      const contentLength = parseInt(res.headers['content-length'] || 0);
      if (contentLength > 50 * 1024 * 1024) { // 限制50MB
        reject(new Error('File too large'));
        return;
      }
      
      // 创建写入流
      const fileStream = fs.createWriteStream(savePath);
      
      let downloadedBytes = 0;
      
      res.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        fileStream.write(chunk);
        
        // 进度回调
        if (options.onProgress && contentLength > 0) {
          const progress = (downloadedBytes / contentLength * 100).toFixed(1);
          options.onProgress(progress);
        }
      });
      
      res.on('end', () => {
        fileStream.end();
        resolve({
          success: true,
          filePath: savePath,
          size: downloadedBytes,
          contentType: res.headers['content-type']
        });
      });
      
      res.on('error', (err) => {
        fileStream.destroy();
        fs.unlink(savePath, () => {});
        reject(err);
      });
    });
    
    req.on('error', reject);
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Download timeout'));
    });
    
    req.end();
  });
}

// 解析试卷页面获取下载链接
async function parsePaperPage(url) {
  try {
    const response = await request(url);
    
    if (response.statusCode !== 200) {
      return null;
    }
    
    const $ = cheerio.load(response.body);
    const downloadLinks = [];
    
    // 查找下载链接
    $('a').each((i, elem) => {
      const href = $(elem).attr('href');
      const text = $(elem).text().trim();
      
      if (href) {
        const fullUrl = href.startsWith('http') ? href : new URL(href, url).toString();
        
        // 检查是否是下载链接
        if (text.includes('下载') || 
            text.includes('点击下载') ||
            fullUrl.includes('.pdf') ||
            fullUrl.includes('.doc') ||
            fullUrl.includes('.docx') ||
            fullUrl.includes('download')) {
          
          downloadLinks.push({
            url: fullUrl,
            text: text,
            type: fullUrl.includes('.pdf') ? 'pdf' : 
                  fullUrl.includes('.docx') ? 'docx' : 
                  fullUrl.includes('.doc') ? 'doc' : 'unknown'
          });
        }
      }
    });
    
    // 提取页面信息
    const title = $('h1').first().text().trim() || 
                  $('title').text().trim() ||
                  '';
    
    const description = $('meta[name="description"]').attr('content') || '';
    
    return {
      title,
      description,
      downloadLinks: downloadLinks.slice(0, 5) // 最多返回5个下载链接
    };
    
  } catch (error) {
    console.error('解析页面失败:', error);
    return null;
  }
}

// 延迟函数
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// 批量下载试卷
async function batchDownloadPapers(papers, downloadDir, options = {}) {
  const results = [];
  
  for (let i = 0; i < papers.length; i++) {
    const paper = papers[i];
    console.log(`下载试卷 ${i + 1}/${papers.length}: ${paper.title}`);
    
    try {
      // 解析页面获取下载链接
      const pageInfo = await parsePaperPage(paper.url);
      
      if (pageInfo && pageInfo.downloadLinks.length > 0) {
        // 优先选择PDF链接
        const downloadLink = pageInfo.downloadLinks.find(l => l.type === 'pdf') || 
                            pageInfo.downloadLinks[0];
        
        const fileName = `${paper.title.replace(/[^\w\u4e00-\u9fa5]/g, '_')}.${downloadLink.type === 'unknown' ? 'pdf' : downloadLink.type}`;
        const savePath = path.join(downloadDir, fileName);
        
        // 下载文件
        const downloadResult = await downloadFile(downloadLink.url, savePath, {
          onProgress: (progress) => {
            console.log(`  下载进度: ${progress}%`);
          }
        });
        
        results.push({
          ...paper,
          localPath: savePath,
          downloadSuccess: true,
          fileSize: downloadResult.size
        });
      } else {
        results.push({
          ...paper,
          downloadSuccess: false,
          error: '未找到下载链接'
        });
      }
      
      // 延迟避免被封
      await delay(2000 + Math.random() * 3000);
      
    } catch (error) {
      console.error(`下载失败 ${paper.title}:`, error.message);
      results.push({
        ...paper,
        downloadSuccess: false,
        error: error.message
      });
    }
  }
  
  return results;
}

module.exports = {
  searchPapersWithCrawler,
  downloadFile,
  parsePaperPage,
  batchDownloadPapers,
  crawlerConfigs
};
