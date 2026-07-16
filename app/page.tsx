"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, LayoutTemplate, Smartphone, 
  Send, Palette, Type, Image as ImageIcon, 
  CheckCircle2, Sparkles, ChevronRight,
  LayoutGrid, CircleUserRound, Store, 
  ShoppingBag, Edit2, Save, PawPrint, 
  Download, Plus, Lightbulb, X,
  Layers, Lock, FileText, BookOpen, Box, Monitor, Wand2, Info, Check, Clock, User,
  Scissors, Stethoscope, Coffee
} from 'lucide-react';

// 针对宠物行业配置的视觉风格库 (已绑定真实云端URL以供演示)
const STYLE_MAPPINGS = {
  warm: {
    id: 'warm',
    name: '温馨治愈',
    desc: '暖咖/米色调，适合社区洗护/生活馆',
    primary: '#D49887', secondary: '#F5DFD6', accent: '#A3B19B', bg: '#FFFAF0', text: '#4A3C31',
    fontTitle: 'Serif (思源宋体)', fontBody: 'Sans-serif (系统默认)',
    tags: ['温暖', '治愈', '亲和', '陪伴'],
    images: {
      logo: 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80',
      cover: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80',
      wechatPoster: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80',
      xhsPoster: 'https://images.unsplash.com/photo-1537151608804-ea2f1a79fd22?auto=format&fit=crop&w=800&q=80',
      works: [
        'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1537151608804-ea2f1a79fd22?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1513360371669-4adf3dd7dff8?auto=format&fit=crop&w=400&q=80'
      ]
    }
  },
  playful: {
    id: 'playful',
    name: '活力俏皮',
    desc: '明黄/亮蓝撞色，适合商场高端宠物SPA',
    primary: '#FF9900', secondary: '#0066FF', accent: '#FFD700', bg: '#FFFFFF', text: '#333333',
    fontTitle: 'Sans-serif (思源黑体)', fontBody: 'Sans-serif (系统默认)',
    tags: ['活力', '高端', '多巴胺', '专业洗护'],
    images: {
      logo: 'https://github.com/user-attachments/assets/42612de6-2f00-4891-a8bc-c4f63baf30e0',
      banner: 'https://github.com/user-attachments/assets/f94b005d-ea65-49c1-aace-a041ced9e3ab',
      cover: 'https://github.com/user-attachments/assets/1d8f5760-df69-45fe-9b65-9de8bdc7ede2',
      wechatPoster: 'https://github.com/user-attachments/assets/783169d8-d37d-4c52-9579-6e018e57fb0a',
      xhsPoster: 'https://github.com/user-attachments/assets/0e8972e4-bf88-49c3-9ff4-6707df121c1a',
      works: [
        'https://github.com/user-attachments/assets/32b7ff44-db14-4709-982a-7d889c52ed58',
        'https://github.com/user-attachments/assets/aeadf92e-e83c-4645-8c26-d67762a18f2e',
        'https://github.com/user-attachments/assets/f3dd7d7e-d024-4114-9385-50fdeac36b9a',
        'https://github.com/user-attachments/assets/6022e083-146d-4e79-b5a4-0c9e9097082c'
      ]
    }
  },
  premium: {
    id: 'premium',
    name: '专业严谨',
    desc: '藏蓝/银灰，适合高端医疗/诊所',
    primary: '#2C3E50', secondary: '#BDC3C7', accent: '#E74C3C', bg: '#F8F9FA', text: '#2C3E50',
    fontTitle: 'Sans-serif (苹方中粗)', fontBody: 'Sans-serif (系统默认)',
    tags: ['专业', '严谨', '高端', '干净'],
    images: {
      logo: 'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=400&q=80',
      banner: 'https://images.unsplash.com/photo-1537151625747-768eb6cf92b2?auto=format&fit=crop&w=800&q=80',
      cover: 'https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=800&q=80',
      wechatPoster: 'https://images.unsplash.com/photo-1584042858197-236357d77a83?auto=format&fit=crop&w=800&q=80',
      xhsPoster: 'https://images.unsplash.com/photo-1625316708582-7c38734be31d?auto=format&fit=crop&w=800&q=80',
      works: [
        'https://images.unsplash.com/photo-1625316708582-7c38734be31d?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1584042858197-236357d77a83?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1589883661923-6476cb0ae9f2?auto=format&fit=crop&w=400&q=80',
        'https://images.unsplash.com/photo-1601758228041-f3b279ce7bec?auto=format&fit=crop&w=400&q=80'
      ]
    }
  }
};

export default function App() {
  const [appState, setAppState] = useState({
    shopName: '',
    shopSlogan: '人宠共悦的美好生活提案',
    shopType: '', 
    shopPositioning: '', 
    logoType: null, 
    brandVisual: null, 
    materials: [],
    meituanMainImageDesc: '',
    meituanProducts: [], 
    xiaohongshuProfileDesc: '',
    xiaohongshuPosts: [],
    xhsCurrentView: 'profile',
    activeXhsPost: null,
    socialEvent: null
  });

  const [chatHistory, setChatHistory] = useState([]);
  const [inputText, setInputText] = useState('');
  const [chatStep, setChatStep] = useState('welcome'); 
  const [previewPlatform, setPreviewPlatform] = useState('meituan');
  const messagesEndRef = useRef(null);
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', slogan: '', type: '', positioning: '' });

  const getCurrentTime = () => {
    const now = new Date();
    return `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleActionClick = (actionType, payload, isFromText = false) => {
    if (!isFromText) {
      setChatHistory(prev => [...prev, { role: 'user', type: 'text', content: payload.label, time: getCurrentTime() }]);
    }

    if (actionType === 'shop_type_choice') {
      setAppState(prev => ({ ...prev, shopType: payload.value }));
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev, 
          { role: 'system', type: 'text', content: `收到，主要业务为「${payload.value}」。\n接下来，请问您的店铺叫什么名字？\n(如果有 Slogan 也可以一起告诉我，用逗号隔开)`, time: getCurrentTime() }
        ]);
        setChatStep('ask_name');
      }, 600);
    }
    else if (actionType === 'platform_choice') {
      setPreviewPlatform(payload.value);
      setTimeout(() => {
        if (payload.value === 'meituan') {
          if (!appState.meituanMainImageDesc) {
              setChatHistory(prev => [...prev, { role: 'system', type: 'text', content: '好的，我们先从美团店铺门面开始。美团主图是客户的第一印象，您希望主图主要展示什么？\n（例如：高端干净的洗护区，或者可爱的宠物特写）', time: getCurrentTime() }]);
              setChatStep('ask_meituan_main');
          } else {
              setChatHistory(prev => [...prev, { role: 'system', type: 'text', content: '欢迎回到美团阵地，请问您想继续上架什么商品？', time: getCurrentTime() }]);
              setChatStep('ask_meituan_product');
          }
        } else if (payload.value === 'xiaohongshu') {
          if (!appState.xiaohongshuProfileDesc) {
              setChatHistory(prev => [...prev, { role: 'system', type: 'text', content: '好的，转战小红书。发笔记前我们需要先精装修账号主页。\n\n您希望小红书主页背景图展示什么感觉？\n(例如：店内的网红打卡墙，或者温馨的宠物互动)', time: getCurrentTime() }]);
              setChatStep('ask_xhs_profile');
          } else {
              setChatHistory(prev => [...prev, { role: 'system', type: 'text', content: '欢迎回到小红书，您想发布什么新笔记？', time: getCurrentTime() }]);
              setChatStep('ask_xhs_post');
          }
        } else if (payload.value === 'wechat') {
          setChatHistory(prev => [...prev, { role: 'system', type: 'text', content: `好的，转战微信朋友圈。您最近想做什么营销活动？\n(例如：周末带宠打卡免费送罐头)`, time: getCurrentTime() }]);
          setChatStep('ask_event');
        }
      }, 600);
    }
  };

  const handleSendMessage = () => {
    if (!inputText.trim()) return;

    const currentInput = inputText;
    const newUserMsg = { role: 'user', type: 'text', content: currentInput, time: getCurrentTime() };
    setChatHistory(prev => [...prev, newUserMsg]);
    setInputText('');

    if (chatStep.startsWith('ask_') || chatStep.startsWith('wait_')) {
       if ((currentInput.includes('红书') || currentInput.includes('小红书'))) {
           if(previewPlatform !== 'xiaohongshu') setPreviewPlatform('xiaohongshu');
           
           if (!appState.xiaohongshuProfileDesc) {
              setTimeout(() => {
                setChatHistory(prev => [...prev, { role: 'system', type: 'text', content: '好的，转战小红书。发笔记前我们需要先精装修账号主页。\n\n您希望小红书主页背景图展示什么感觉？', time: getCurrentTime() }]);
                setChatStep('ask_xhs_profile');
              }, 600);
           } else {
              setTimeout(() => {
                const newPost = { 
                  title: currentInput, 
                  image: appState.brandVisual.id === 'playful' ? appState.brandVisual.images.xhsPoster : STYLE_MAPPINGS.warm.images.works[2], 
                  desc: `谁说精致生活只能属于人类呀🥹
现在的小朋友也值得拥有一次认真呵护～

带 TA 来体验了一次【爱宠 SPA】
像走进了一家宠物专属的高级护理会所✨

🫧 猫狗独立洗护空间
🧴 温和低压洗护流程
🤍 一宠一浴·安心护理
✨ 专业皮毛调理，让毛孩子焕发光泽

整个过程比想象中更舒适～
没有嘈杂等待，也没有紧张害怕，
每一步都是为毛孩子设计的温柔体验。

📍高端商场宠物 SPA 新体验
给 TA 一次被认真照顾的仪式感🐶🐱

#宠物SPA #高端养宠 #宠物美容 #精致养宠 #宠物护理 #爱宠生活 #商场宠物店 #养宠人的幸福瞬间`,
                  tags: appState.brandVisual.tags 
                };
                setAppState(prev => ({
                  ...prev,
                  xiaohongshuPosts: [newPost, ...prev.xiaohongshuPosts],
                  xhsCurrentView: 'detail',
                  activeXhsPost: newPost,
                  materials: [...prev.materials, { id: `x_post_${Date.now()}`, platform: 'xiaohongshu', name: '小红书营销海报', size: '1080x1440' }]
                }));
                setChatHistory(prev => [
                  ...prev,
                  { role: 'system', type: 'result_card', content: `🎉 全套营销物料已生成完毕！\n\n您的活动海报和封面已经渲染完成。\n\n您可以：\n1. 在中间面板调整色彩或编辑文案\n2. 在右侧切换平台查看最终真实效果`, time: getCurrentTime() }
                ]);
                setChatStep('wait_action_product');
              }, 800);
           }
           return;
       }
       if ((currentInput.includes('微信') || currentInput.includes('朋友圈') || currentInput.includes('海报'))) {
           if(previewPlatform !== 'wechat') setPreviewPlatform('wechat');
           setTimeout(() => {
             setAppState(prev => ({
              ...prev,
              socialEvent: { title: currentInput },
              materials: [...prev.materials, { id: `w_${Date.now()}`, platform: 'wechat', name: '朋友圈营销海报', size: '1080x1920' }]
            }));
            setChatHistory(prev => [
              ...prev,
              { role: 'system', type: 'result_card', content: `🎉 全套营销物料已生成完毕！\n您的专属促销海报已经渲染完成。`, time: getCurrentTime() }
            ]);
            setChatStep('ask_event');
          }, 800);
          return;
       }
       if ((currentInput.includes('美团') || currentInput.includes('门面')) && previewPlatform !== 'meituan') {
           handleActionClick('platform_choice', {label: '回美团', value: 'meituan'}, true);
           return;
       }
    }

    if (chatStep === 'ask_name') {
      const parts = currentInput.split(/[,，\s]+/);
      const name = parts[0];
      const slogan = parts.length > 1 ? parts.slice(1).join(' ') : '人宠共悦的美好生活提案';
      
      setAppState(prev => ({ ...prev, shopName: name, shopSlogan: slogan }));
      
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev, 
          { role: 'system', type: 'text', content: `太棒了，「${name}」是个很有温度的名字！\n为了给您推荐最匹配的视觉风格，请简单描述一下您的【具体客群和特色定位】。\n(例如：面向社区的平价洗护，或者高端商场里的宠物SPA)`, time: getCurrentTime() }
        ]);
        setChatStep('ask_positioning'); 
      }, 600);
    } 
    else if (chatStep === 'ask_positioning') {
      setAppState(prev => ({ ...prev, shopPositioning: currentInput }));
      setTimeout(() => {
        setChatHistory(prev => [
          ...prev, 
          { role: 'system', type: 'text', content: `了解！您的定位已经记录。\n结合您的定位，我为您推荐了以下几种品牌视觉体系。请选择最符合您期望的风格：`, time: getCurrentTime() },
          { role: 'system', type: 'style_cards', options: Object.values(STYLE_MAPPINGS) }
        ]);
        setChatStep('ask_style');
      }, 600);
    }
    else if (chatStep === 'ask_meituan_main') {
      setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          meituanMainImageDesc: currentInput,
          materials: [...prev.materials, { id: 'm1', platform: 'meituan', name: '美团店铺主图', size: '800x800' }]
        }));
        
        setChatHistory(prev => [
          ...prev,
          { role: 'system', type: 'text', content: `门面主图已为您配置完毕（请看右侧效果）！\n现在门面有了，我们需要在店里上架具体的服务。请问您准备主推什么商品？价格是多少？\n(例如：专属皮毛调理洗护，168元)`, time: getCurrentTime() }
        ]);
        setChatStep('ask_meituan_product');
      }, 800);
    }
    else if (chatStep === 'ask_meituan_product' || chatStep === 'wait_action_product') {
      const priceMatch = currentInput.match(/(\d+)/);
      const price = priceMatch ? priceMatch[0] : '168';
      const title = currentInput.replace(/\d+元?/, '').trim() || currentInput;
      
      setTimeout(() => {
        setAppState(prev => {
          const productCount = prev.meituanProducts.length;
          const imageSrc = prev.brandVisual?.images?.works?.[productCount % 4] || STYLE_MAPPINGS.warm.images.works[0];
          return {
            ...prev,
            meituanProducts: [...prev.meituanProducts, { title, price, image: imageSrc }],
            materials: [...prev.materials, { id: `m_prod_${Date.now()}`, platform: 'meituan', name: `商品封面 - ${title}`, size: '400x400' }]
          }
        });
        setChatHistory(prev => [
          ...prev,
          { role: 'system', type: 'text', content: `「${title}」已成功上架！专业图文已匹配（右侧可见）。\n\n接下来您想继续添加商品，还是转战其他平台做营销？`, time: getCurrentTime() }
        ]);
        setChatStep('wait_action_product');
      }, 800);
    }
    else if (chatStep === 'ask_xhs_profile') {
      setTimeout(() => {
        setAppState(prev => ({
          ...prev,
          xiaohongshuProfileDesc: currentInput,
          materials: [...prev.materials, { id: 'x_prof', platform: 'xiaohongshu', name: '小红书账号主页', size: '1080x810' }]
        }));
        setChatHistory(prev => [
          ...prev,
          { role: 'system', type: 'text', content: `账号门面已搭建完毕（右侧已更新）！看起来非常吸粉。\n\n现在主页搭好了，您想发布第一篇什么主题的营销笔记？`, time: getCurrentTime() }
        ]);
        setChatStep('ask_xhs_post');
      }, 800);
    }
    else if (chatStep === 'ask_xhs_post') {
      setTimeout(() => {
        const newPost = { 
          title: '✨商场里藏着一家宠物 SPA，终于找到宠物的“高级护理空间”🐾', 
          image: appState.brandVisual.id === 'playful' ? appState.brandVisual.images.xhsPoster : STYLE_MAPPINGS.warm.images.works[2], 
          desc: `谁说精致生活只能属于人类呀🥹
现在的小朋友也值得拥有一次认真呵护～

带 TA 来体验了一次【爱宠 SPA】
像走进了一家宠物专属的高级护理会所✨

🫧 猫狗独立洗护空间
🧴 温和低压洗护流程
🤍 一宠一浴·安心护理
✨ 专业皮毛调理，让毛孩子焕发光泽

整个过程比想象中更舒适～
没有嘈杂等待，也没有紧张害怕，
每一步都是为毛孩子设计的温柔体验。

📍高端商场宠物 SPA 新体验
给 TA 一次被认真照顾的仪式感🐶🐱

#宠物SPA #高端养宠 #宠物美容 #精致养宠 #宠物护理 #爱宠生活 #商场宠物店 #养宠人的幸福瞬间`,
          tags: appState.brandVisual.tags 
        };
        setAppState(prev => ({
          ...prev,
          xiaohongshuPosts: [newPost, ...prev.xiaohongshuPosts],
          xhsCurrentView: 'detail',
          activeXhsPost: newPost,
          materials: [...prev.materials, { id: `x_post_${Date.now()}`, platform: 'xiaohongshu', name: '小红书营销海报', size: '1080x1440' }]
        }));
        setChatHistory(prev => [
          ...prev,
          { role: 'system', type: 'result_card', content: `🎉 全套营销物料已生成完毕！\n\n您的活动海报和封面已经渲染完成。\n\n您可以：\n1. 在中间面板调整色彩或编辑文案\n2. 在右侧切换平台查看最终真实效果`, time: getCurrentTime() }
        ]);
        setChatStep('wait_action_product');
      }, 800);
    }
    else if (chatStep === 'ask_event') {
      setTimeout(() => {
         setAppState(prev => ({
          ...prev,
          socialEvent: { title: currentInput },
          materials: [...prev.materials, { id: `w_${Date.now()}`, platform: 'wechat', name: '朋友圈营销海报', size: '1080x1920' }]
        }));
        setChatHistory(prev => [
          ...prev,
          { role: 'system', type: 'result_card', content: `🎉 全套营销物料已生成完毕！\n您的专属促销海报已经渲染完成。`, time: getCurrentTime() }
        ]);
        setChatStep('ask_event');
      }, 800);
    }
  };

  const handleSelectStyle = (styleId) => {
    const style = STYLE_MAPPINGS[styleId];
    setChatHistory(prev => [
      ...prev,
      { role: 'user', type: 'text', content: `我选择：${style.name}`, time: getCurrentTime() },
      { role: 'system', type: 'text', content: `【品牌视觉体系已建立】\n中间资产面板已为您提取色彩与排版规范。\n\n接下来，系统将协助您将品牌落地到具体平台。您想先重点完善哪个平台？`, time: getCurrentTime() },
      { role: 'system', type: 'actions', options: [
          { label: '美团店铺主页', type: 'platform_choice', value: 'meituan' },
          { label: '小红书账号', type: 'platform_choice', value: 'xiaohongshu' },
          { label: '微信朋友圈', type: 'platform_choice', value: 'wechat' }
      ]}
    ]);
    setAppState(prev => ({ ...prev, brandVisual: style }));
    setChatStep('wait_action_platform');
  };

  const handleStartChat = () => {
    setChatHistory([
      { role: 'system', type: 'text', content: '你好！我是 PAWMUSE 智能品牌向导。\n用 10 分钟，我将帮你打造一家专业且有温度的品牌形象 ✨\n\n首先，请问您的店铺主打什么业务类型？', time: getCurrentTime() },
      { role: 'system', type: 'actions_cards', options: [
          { label: '宠物店', icon: PawPrint, value: '宠物店' },
          { label: '水果店', icon: Apple, value: '水果店' },
          { label: '家具店', icon: Sofa, value: '家具店' },
          { label: '餐饮店', icon: Coffee, value: '餐饮店' }
      ]}
    ]);
    setChatStep('ask_shop_type');
  };

  const Apple = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z"/><path d="M10 2c1 .5 2 2 2 5"/></svg>;
  const Sofa = (props) => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 16v-2a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v2"/><path d="M4 16v4"/><path d="M20 16v4"/><path d="M4 16h16"/></svg>;

  const renderChatPanel = () => {
    if (chatStep === 'welcome') {
      return (
        <div className="flex flex-col h-full bg-[#FFFCFA] overflow-y-auto w-full z-10 relative">
          <style>{`
            .hide-scrollbar::-webkit-scrollbar { display: none; }
            .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
          `}</style>
          
          <div className="flex flex-col items-center justify-center p-6 w-full max-w-[420px] mx-auto min-h-full">
            <div className="flex flex-col items-center gap-3 mb-10">
              <div className="w-16 h-16 relative flex items-center justify-center mb-4">
                 <div className="absolute w-10 h-12 bg-[#EACAC0] rounded-sm transform -skew-x-12 rotate-12 opacity-80 blur-[1px]"></div>
                 <div className="absolute w-8 h-14 bg-[#D49887] rounded-sm transform skew-x-12 -rotate-12 mix-blend-multiply opacity-90 blur-[0.5px]"></div>
                 <div className="absolute w-5 h-10 bg-[#F5DFD6] rounded-sm transform skew-x-12 rotate-45 opacity-60"></div>
              </div>
              <div className="flex flex-col items-center">
                <span className="font-extrabold text-[26px] leading-none text-[#4A3C31] tracking-[0.1em] mb-2">PAWMUSE</span>
                <span className="text-[12px] text-[#8B7C72] tracking-[0.25em]">智能品牌视觉系统</span>
              </div>
            </div>

            <div className="text-center mb-10">
              <h1 className="text-[24px] font-bold text-[#4A3C31] mb-3 flex items-center justify-center gap-2">
                开启您的品牌之旅 <Sparkles className="w-5 h-5 text-[#E3B09F]" />
              </h1>
              <p className="text-[13px] text-[#8B7C72]">AI 助力打造专业、一致，有温度的品牌形象</p>
            </div>

            <button
              onClick={handleStartChat}
              className="w-full bg-[#FDF3EE] hover:bg-[#F9E8DF] transition-all rounded-3xl p-6 flex flex-col items-center justify-center mb-10 border border-[#F5E6DF] group cursor-pointer shadow-sm"
            >
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center mb-3 shadow-sm group-hover:scale-105 transition-transform text-[#D49887]">
                <Plus className="w-6 h-6" strokeWidth={2.5} />
              </div>
              <h2 className="text-[16px] font-bold text-[#4A3C31] mb-1">创建新店铺</h2>
              <p className="text-[12px] text-[#8B7C72]">从零开始，创建您的品牌资产</p>
            </button>

            <div className="w-full">
              <div className="flex items-center justify-between mb-4 px-1">
                 <h3 className="text-[14px] font-bold text-[#4A3C31]">最近的店铺</h3>
                 <span className="text-[12px] text-[#A69B95] cursor-pointer hover:text-[#E3B09F] transition-colors">查看全部</span>
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar -mx-2 px-2 snap-x">
                {[
                  { name: '爱宠生活馆', desc: '温馨治愈 · 社区洗护', color: '#D49887' },
                  { name: 'PAW PAW', desc: '活力俏皮 · 潮宠用品', color: '#FAD980' },
                  { name: '喵星球', desc: '日式精致 · 猫咪寄养', color: '#A3B19B' }
                ].map((shop, i) => (
                  <div key={i} className="min-w-[150px] snap-start flex-1 bg-white p-4 rounded-2xl flex flex-col items-start border border-[#F5F1EF] shadow-sm hover:border-[#F5DFD6] hover:shadow-md transition-all cursor-pointer">
                     <div className="w-10 h-10 rounded-xl mb-3 flex items-center justify-center text-white font-bold text-[16px] shadow-sm" style={{backgroundColor: shop.color}}>
                        {shop.name.charAt(0)}
                     </div>
                     <h4 className="text-[14px] font-bold text-[#4A3C31] mb-1 truncate w-full">{shop.name}</h4>
                     <p className="text-[11px] text-[#A69B95] truncate w-full">{shop.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col h-full bg-[#FFFCFA] z-10 relative">
        <div className="h-16 border-b border-[#F5F1EF] flex items-center justify-between px-6 shrink-0 bg-[#FFFCFA] z-20">
          <span className="font-bold text-[#4A3C31] tracking-wide text-[16px] flex items-center gap-2">
            PAWMUSE 品牌向导
          </span>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-[#FDF3EE] rounded-full text-[#D49887] text-[11px] font-medium border border-[#F5E6DF]">
             <div className="w-1.5 h-1.5 rounded-full bg-[#D49887] animate-pulse"></div>
             品牌搭建中
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#FFFCFA]">
          {chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
              {msg.type === 'text' && (
                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  <div className={`px-4 py-3 rounded-2xl text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user' 
                      ? 'bg-[#FDF3EE] text-[#4A3C31] rounded-tr-sm' 
                      : 'bg-white border border-[#F5F1EF] text-gray-700 rounded-tl-sm'
                  }`}>
                    {msg.content.split('\n').map((line, i) => <p key={i} className="mb-1 last:mb-0">{line}</p>)}
                  </div>
                  <div className="text-[10px] text-gray-400 mt-1.5 px-2 flex items-center gap-1">
                    {msg.time} {msg.role === 'user' && <Check className="w-3 h-3 text-[#D49887] ml-0.5" />}
                  </div>
                </div>
              )}
              {msg.type === 'actions_cards' && (
                <div className="flex overflow-x-auto w-full pb-2 hide-scrollbar snap-x gap-2 mt-3 -mx-2 px-2">
                  {msg.options.map((opt, i) => (
                    <button key={i} onClick={() => handleActionClick('shop_type_choice', opt)}
                            className="snap-start shrink-0 bg-white border border-[#F5F1EF] text-[#4A3C31] px-4 py-2.5 rounded-xl text-[13px] font-bold hover:bg-[#FDF3EE] hover:border-[#F5E6DF] hover:text-[#D49887] transition-all shadow-sm flex items-center justify-center gap-2 group">
                      <opt.icon className="w-4 h-4 text-[#A69B95] group-hover:text-[#D49887]" />
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {msg.type === 'actions' && (
                <div className="flex flex-wrap gap-2 mt-3 w-full">
                  {msg.options.map((opt, i) => (
                    <button key={i} onClick={() => handleActionClick(opt.type, opt)}
                            className="bg-white border border-[#F5F1EF] text-[#4A3C31] px-5 py-2.5 rounded-full text-[13px] font-medium hover:bg-[#FDF3EE] hover:border-[#F5E6DF] hover:text-[#D49887] transition-all shadow-sm flex items-center gap-1.5">
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {msg.type === 'style_cards' && (
                <div className="grid grid-cols-2 gap-3 mt-3 w-full max-w-full">
                  {msg.options.map((style) => (
                     <div key={style.id} onClick={() => handleSelectStyle(style.id)}
                          className="bg-white rounded-2xl overflow-hidden border border-[#F5F1EF] cursor-pointer hover:border-[#F5D8CA] hover:shadow-md transition-all group flex flex-col">
                        <div className="h-16 flex items-center justify-center bg-[#FAFAFA] border-b border-[#F5F1EF] relative">
                           <div className="flex gap-2 z-10">
                              <div className="w-5 h-5 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: style.primary }}></div>
                              <div className="w-5 h-5 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: style.secondary }}></div>
                              <div className="w-5 h-5 rounded-full shadow-sm border-2 border-white" style={{ backgroundColor: style.accent }}></div>
                           </div>
                        </div>
                        <div className="p-3 text-center flex-1 flex flex-col justify-center">
                          <div className="font-bold text-[#4A3C31] text-[13px] mb-0.5">{style.name}</div>
                          <div className="text-[10px] text-[#A69B95] line-clamp-2 leading-tight">{style.desc}</div>
                        </div>
                     </div>
                  ))}
                </div>
              )}
              {msg.type === 'result_card' && (
                <div className="mt-3 bg-white border border-[#FDF3EE] p-5 rounded-2xl shadow-sm w-[90%] max-w-[320px]">
                   <div className="flex items-center gap-2 text-[#27AE60] font-bold text-[14px] mb-3">
                     <CheckCircle2 className="w-5 h-5" /> 交付就绪
                   </div>
                   <div className="text-[13px] text-gray-700 leading-relaxed whitespace-pre-line">{msg.content}</div>
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-4 bg-[#FFFCFA] shrink-0 border-t border-[#F5F1EF] z-20">
          <div className="flex items-center gap-2 bg-white border border-[#F5F1EF] rounded-full px-4 py-2 focus-within:border-[#F5D8CA] focus-within:shadow-sm transition-all shadow-sm">
            <input 
              type="text" 
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="在此输入回复 (随时可输入)..."
              className="flex-1 bg-transparent text-[13px] outline-none text-[#4A3C31] placeholder-gray-400 py-1"
            />
            <button 
              onClick={handleSendMessage}
              disabled={!inputText.trim()}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${inputText.trim() ? 'bg-[#D49887] text-white shadow-sm hover:bg-[#C08573]' : 'bg-[#F5F1EF] text-white'}`}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderDetailPanel = () => {
    const bv = appState.brandVisual;
    const isReady = !!bv;

    if (!isReady) {
      return (
        <div className="h-full bg-white border-r border-[#F5F1EF] overflow-hidden">
          <div className="p-6 h-full flex flex-col">
            <div className="flex items-center gap-2 mb-8 shrink-0">
              <Layers className="w-[20px] h-[20px] text-[#4A3C31]" strokeWidth={2.5} />
              <h1 className="text-[18px] font-bold text-[#4A3C31] tracking-wide">品牌资产</h1>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center pt-4 animate-in fade-in duration-500 overflow-hidden">
              
              <div className="mb-6 flex flex-col items-center justify-center relative">
                 <svg width="100" height="100" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <ellipse cx="60" cy="100" rx="45" ry="10" fill="url(#shadowGrad)" opacity="0.5"/>
                    <path d="M42 50C42 40.0589 50.0589 32 60 32C69.9411 32 78 40.0589 78 50V56H42V50Z" stroke="url(#lockRing)" strokeWidth="8" strokeLinecap="round"/>
                    <rect x="34" y="56" width="52" height="40" rx="10" fill="url(#lockBody)" stroke="#FDF3EE" strokeWidth="2" shadow="sm"/>
                    <path d="M60 70C58.3431 70 57 71.3431 57 73C57 74.2052 57.7121 75.2443 58.75 75.7294V82C58.75 82.6904 59.3096 83.25 60 83.25C60.6904 83.25 61.25 82.6904 61.25 82V75.7294C62.2879 75.2443 63 74.2052 63 73C63 71.3431 61.6569 70 60 70Z" fill="#D49887" opacity="0.9"/>
                    <defs>
                      <linearGradient id="shadowGrad" x1="60" y1="90" x2="60" y2="110" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#EACAC0"/>
                        <stop offset="1" stopColor="white" stopOpacity="0"/>
                      </linearGradient>
                      <linearGradient id="lockRing" x1="60" y1="32" x2="60" y2="56" gradientUnits="userSpaceOnUse">
                        <stop stopColor="#F5DFD6"/>
                        <stop offset="1" stopColor="#EACAC0"/>
                      </linearGradient>
                      <linearGradient id="lockBody" x1="60" y1="56" x2="60" y2="96" gradientUnits="userSpaceOnUse">
                        <stop stopColor="white"/>
                        <stop offset="1" stopColor="#FDF3EE"/>
                      </linearGradient>
                    </defs>
                 </svg>
              </div>

              <h2 className="text-[18px] font-bold text-[#4A3C31] mb-2">完成基础风格后解锁</h2>
              <p className="text-[12px] text-[#8B7C72] mb-8 text-center px-4 leading-relaxed">完善店铺基础信息与风格偏好后，<br/>我们将为你生成专属品牌资产。</p>

              <div className="grid grid-cols-2 gap-3 w-full max-w-[320px]">
                <div className="bg-white rounded-2xl p-4 border border-[#FDF2E9] flex flex-col relative h-[90px] shadow-sm items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#EACAC0] absolute top-3 right-3" />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D49887" strokeWidth="1.5" className="mb-2">
                     <circle cx="12" cy="12" r="6"/><path d="M12 2v4"/><path d="M12 18v4"/><path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/><path d="M2 12h4"/><path d="M18 12h4"/><path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
                  </svg>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#4A3C31]">Logo</span>
                    <span className="text-[10px] text-[#A69B95]">专属品牌标识</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#FDF2E9] flex flex-col relative h-[90px] shadow-sm items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#EACAC0] absolute top-3 right-3" />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="mb-2">
                     <circle cx="8" cy="8" r="4" fill="#A69B95"/><circle cx="16" cy="8" r="4" fill="#D49887"/><circle cx="8" cy="16" r="4" fill="#EACAC0"/><circle cx="16" cy="16" r="4" fill="#FDF3EE"/>
                  </svg>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#4A3C31]">标准色</span>
                    <span className="text-[10px] text-[#A69B95]">品牌色彩方案</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#FDF2E9] flex flex-col relative h-[90px] shadow-sm items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#EACAC0] absolute top-3 right-3" />
                  <div className="mb-1 text-[24px] font-serif font-bold text-[#D49887] leading-none">Aa</div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[13px] font-bold text-[#4A3C31]">字体</span>
                    <span className="text-[10px] text-[#A69B95]">品牌字体组合</span>
                  </div>
                </div>

                <div className="bg-white rounded-2xl p-4 border border-[#FDF2E9] flex flex-col relative h-[90px] shadow-sm items-center justify-center">
                  <Lock className="w-3.5 h-3.5 text-[#EACAC0] absolute top-3 right-3" />
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#D49887" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-bold text-[#4A3C31]">风格</span>
                    <span className="text-[10px] text-[#A69B95]">风格指引</span>
                  </div>
                </div>
              </div>

              <div className="mt-8 bg-[#FFF5F0] rounded-xl py-3 px-6 border border-[#FDF2E9] flex items-center gap-2 w-full max-w-[320px] justify-center shadow-sm">
                <Sparkles className="w-4 h-4 text-[#D49887]" />
                <span className="text-[11px] text-[#D49887] font-medium tracking-wide">提示：更多资产模块将在后续步骤中解锁</span>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full bg-white border-r border-[#F5F1EF] overflow-hidden">
        <div className="p-6 h-full flex flex-col">
          <div className="flex items-center gap-2 mb-6 shrink-0">
             <Layers className="w-[20px] h-[20px] text-[#333333]" strokeWidth={2.5} />
             <h1 className="text-[18px] font-bold text-[#333333] tracking-wide">品牌资产</h1>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2 pb-10 hide-scrollbar">
             
             <div className="bg-white rounded-2xl p-5 border border-[#F5F1EF] shadow-sm relative group animate-in slide-in-from-bottom-2">
                <div className="flex gap-4 items-center">
                   <div className="w-[84px] h-[84px] rounded-2xl flex items-center justify-center shrink-0 border border-[#FDF2E9] overflow-hidden bg-[#FFF5F0]">
                      <img src={bv.images.logo} className="w-16 h-16 object-contain" alt="logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80'; }} />
                   </div>
                   <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-start mb-1">
                         <h2 className="text-[18px] font-bold text-[#333333] leading-tight truncate">{appState.shopName || '未命名店铺'}</h2>
                         <button onClick={() => {
                           setEditForm({name: appState.shopName, slogan: appState.shopSlogan, type: appState.shopType, positioning: appState.shopPositioning});
                           setIsEditingProfile(true);
                         }} className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-2">
                            <Edit2 className="w-3.5 h-3.5 text-[#A69B95] hover:text-[#D49887]" />
                         </button>
                      </div>
                      <p className="text-[12px] text-[#666666] mb-3 truncate">{appState.shopSlogan}</p>
                      <div className="flex gap-2 flex-wrap">
                         {appState.shopType && <span className="text-[11px] px-3 py-1 rounded-full border border-[#F5F1EF] bg-[#F8F9FA] text-[#666666] whitespace-nowrap">{appState.shopType}</span>}
                         {appState.shopPositioning && <span className="text-[11px] px-3 py-1 rounded-full border border-[#F5F1EF] bg-[#F8F9FA] text-[#666666] whitespace-nowrap">{appState.shopPositioning}</span>}
                      </div>
                   </div>
                </div>

                {isEditingProfile && (
                  <div className="absolute inset-0 bg-white rounded-2xl p-4 z-10 flex flex-col gap-3 shadow-md border border-[#F5E6DF] animate-in fade-in">
                    <input type="text" value={editForm.name} onChange={e=>setEditForm({...editForm, name: e.target.value})} className="w-full text-[14px] font-bold border-b border-[#F5F1EF] pb-1 outline-none text-[#4A3C31]" placeholder="店铺名称" />
                    <input type="text" value={editForm.slogan} onChange={e=>setEditForm({...editForm, slogan: e.target.value})} className="w-full text-[12px] border-b border-[#F5F1EF] pb-1 outline-none text-[#8B7C72]" placeholder="Slogan" />
                    <div className="flex gap-2">
                       <input type="text" value={editForm.type} onChange={e=>setEditForm({...editForm, type: e.target.value})} className="flex-1 text-[11px] border border-[#F5F1EF] rounded p-1.5 outline-none text-[#4A3C31]" placeholder="类型" />
                       <input type="text" value={editForm.positioning} onChange={e=>setEditForm({...editForm, positioning: e.target.value})} className="flex-1 text-[11px] border border-[#F5F1EF] rounded p-1.5 outline-none text-[#4A3C31]" placeholder="定位" />
                    </div>
                    <div className="flex justify-end gap-2 mt-auto">
                       <button onClick={()=>setIsEditingProfile(false)} className="px-3 py-1 text-[11px] text-[#A69B95] hover:bg-[#FAFAFA] rounded border border-transparent hover:border-[#F5F1EF]">取消</button>
                       <button onClick={()=>{
                         setAppState(prev=>({...prev, shopName: editForm.name, shopSlogan: editForm.slogan, shopType: editForm.type, shopPositioning: editForm.positioning}));
                         setIsEditingProfile(false);
                       }} className="px-3 py-1 text-[11px] bg-[#4A3C31] text-white rounded hover:bg-[#3A2E26] shadow-sm">保存</button>
                    </div>
                  </div>
                )}
             </div>

             <div className="bg-white rounded-2xl p-5 border border-[#F5F1EF] shadow-sm animate-in slide-in-from-bottom-3">
                <div className="flex items-center gap-2 mb-5">
                   <Palette className="w-4 h-4 text-[#D49887]" />
                   <h3 className="text-[14px] font-bold text-[#333333]">色彩体系</h3>
                </div>
                <div className="grid grid-cols-2 gap-y-5 gap-x-4">
                   {[
                     { label: '品牌主色', hex: bv.primary },
                     { label: '辅助色', hex: bv.secondary },
                     { label: '点缀色', hex: bv.accent },
                     { label: '背景色', hex: bv.bg, border: true },
                     { label: '文字色', hex: bv.text }
                   ].map((c, i) => (
                     <div key={i} className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl shrink-0 shadow-sm ${c.border ? 'border border-[#E5E5E5]' : ''}`} style={{ backgroundColor: c.hex }}></div>
                        <div className="flex flex-col">
                           <span className="text-[13px] font-bold text-[#333333] mb-0.5">{c.label}</span>
                           <span className="text-[11px] text-[#999999] uppercase font-mono">{c.hex}</span>
                        </div>
                     </div>
                   ))}
                </div>
             </div>

             <div className="bg-white rounded-2xl p-5 border border-[#F5F1EF] shadow-sm animate-in slide-in-from-bottom-4">
                <div className="flex items-center gap-2 mb-5">
                   <Type className="w-4 h-4 text-[#D49887]" />
                   <h3 className="text-[14px] font-bold text-[#333333]">排版规范</h3>
                </div>
                <div className="flex justify-between gap-3">
                   <div className="flex-1 bg-[#F8F9FA] rounded-xl p-5 border border-transparent text-center flex flex-col items-center justify-center">
                      <div className="text-[26px] mb-2 text-[#333333] font-bold" style={{ fontFamily: bv.fontTitle }}>Ag</div>
                      <div className="text-[12px] font-bold text-[#333333] mb-1">标题字体</div>
                      <div className="text-[11px] text-[#999999]">{bv.fontTitle.split(' ')[0]} Heavy</div>
                   </div>
                   <div className="flex-1 bg-[#F8F9FA] rounded-xl p-5 border border-transparent text-center flex flex-col items-center justify-center">
                      <div className="text-[24px] mb-2 text-[#333333]" style={{ fontFamily: bv.fontBody }}>Ag</div>
                      <div className="text-[12px] font-bold text-[#333333] mb-1">正文字体</div>
                      <div className="text-[11px] text-[#999999]">{bv.fontBody.split(' ')[0]} Regular</div>
                   </div>
                </div>
             </div>

             <div className="bg-white rounded-2xl p-5 border border-[#F5F1EF] shadow-sm animate-in slide-in-from-bottom-5">
                <div className="flex items-center gap-2 mb-4">
                   <ImageIcon className="w-4 h-4 text-[#D49887]" />
                   <h3 className="text-[14px] font-bold text-[#333333]">已生成物料</h3>
                </div>
                {appState.materials.length === 0 ? (
                   <div className="py-8 flex flex-col items-center justify-center text-center bg-[#FAFAFA] rounded-xl border border-dashed border-[#F5F1EF]">
                      <div className="text-[12px] text-[#8B7C72] font-bold mb-1">暂无成型物料</div>
                   </div>
                ) : (
                   <div className="space-y-3">
                     {appState.materials.map((m, i) => (
                        <div key={i} className="flex items-center justify-between p-3 rounded-xl bg-white border border-[#F5F1EF] shadow-sm cursor-pointer hover:border-[#F5DFD6] transition-all relative">
                           <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border
                                 ${m.platform === 'meituan' ? 'bg-[#FFF8E6] border-[#FFE4A0] text-[#FF9900]' : m.platform === 'xiaohongshu' ? 'bg-[#FFE6E8] border-[#FFC7CE] text-[#FF2442]' : 'bg-[#E6F8ED] border-[#B7E8CB] text-[#07C160]'}`}>
                                 {m.platform === 'meituan' ? <Store className="w-5 h-5" /> : m.platform === 'xiaohongshu' ? <BookOpen className="w-5 h-5" /> : <MessageSquare className="w-5 h-5" />}
                              </div>
                              <div>
                                <div className="text-[13px] font-bold text-[#333333] mb-0.5">{m.name}</div>
                                <div className="text-[11px] text-[#999999]">{m.size}</div>
                              </div>
                           </div>
                           <ChevronRight className="w-4 h-4 text-[#CCCCCC]" />
                           <div className="absolute inset-0 z-10" onClick={() => setPreviewPlatform(m.platform)}></div>
                        </div>
                     ))}
                   </div>
                )}
             </div>
          </div>
        </div>
      </div>
    );
  };

  const downloadImage = (e, name) => {
    e.stopPropagation();
    const link = document.createElement('a');
    link.href = appState.brandVisual?.id === 'playful' ? appState.brandVisual.images.wechatPoster : STYLE_MAPPINGS.warm.images.cover; 
    link.download = `${name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const renderMeituanMockup = () => {
    const bv = appState.brandVisual;
    return (
      <div className="h-full flex flex-col animate-in fade-in duration-500" style={{ fontFamily: bv.fontBody, backgroundColor: '#F5F5F5' }}>
        <div className="aspect-[16/9] w-full shrink-0 relative bg-cover bg-center overflow-hidden" style={{ backgroundColor: '#333' }}>
           <img 
              src={appState.meituanMainImageDesc ? bv.images.banner : ''} 
              className="absolute inset-0 w-full h-full object-cover"
              alt="banner"
              style={{ opacity: appState.meituanMainImageDesc ? 1 : 0, transition: 'opacity 0.3s' }}
              onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=800&q=80'; }}
           />
          {!appState.meituanMainImageDesc && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs font-medium z-10 bg-gray-200">等待生成店铺主图...</div>
          )}
          <div className="absolute top-10 left-4 text-white z-20">
             <div className="w-6 h-6 border-t-2 border-l-2 border-white/80 rotate-[-45deg] rounded-sm mb-4"></div>
          </div>
          <div className="absolute top-10 right-4 flex gap-4 text-white z-20">
             <div className="w-5 h-5 border-2 border-white/80 rounded-sm"></div>
             <div className="w-5 h-5 flex flex-col gap-1"><div className="w-5 h-0.5 bg-white/80"></div><div className="w-5 h-0.5 bg-white/80"></div><div className="w-5 h-0.5 bg-white/80"></div></div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
          <div className="absolute bottom-6 left-5 right-5 text-white z-10 flex gap-3 items-end">
             <div className="w-14 h-14 bg-white rounded-xl shadow-md overflow-hidden p-1 shrink-0" style={{ backgroundColor: bv.bg }}>
                <img src={bv.images.logo} className="w-full h-full object-cover" alt="logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80'; }} />
             </div>
             <div className="flex-1 pb-1 overflow-hidden">
                <h2 className="font-bold text-[18px] mb-0.5 tracking-wide drop-shadow-md leading-tight truncate">{appState.shopName}</h2>
                <p className="text-[10px] opacity-90 truncate drop-shadow">{appState.shopSlogan}</p>
             </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 pb-10">
          <div className="bg-white rounded-2xl p-4 shadow-sm mb-4">
             <div className="flex justify-between items-center mb-2">
                <span className="font-bold text-[14px] text-gray-900 truncate pr-2">{appState.shopName}</span>
                <span className="text-[10px] text-[#FF4500] px-2 py-0.5 rounded bg-[#FFF0E6] font-bold border border-[#FFD5C2] shrink-0">★ 5.0分</span>
             </div>
             <div className="flex items-center justify-between text-[11px] text-gray-500">
                <div className="flex gap-2 items-center truncate">
                  <span className="truncate">{appState.shopType || '宠物店'}</span>
                  <div className="w-0.5 h-2 bg-gray-300 shrink-0"></div>
                  <span className="truncate">{appState.shopPositioning || '品质体验'}</span>
                </div>
                <span className="shrink-0 pl-2">距您 500m</span>
             </div>
          </div>

          <div className="mb-3 flex items-center justify-between">
             <div className="flex items-center gap-1.5">
               <div className="w-1 h-3.5 rounded-full" style={{ backgroundColor: bv.primary }}></div>
               <h3 className="font-bold text-[15px] text-gray-900">品牌主推服务</h3>
             </div>
             <span className="text-[11px] text-gray-400 flex items-center">更多 <ChevronRight className="w-3 h-3" /></span>
          </div>

          <div className="space-y-3">
             {appState.meituanProducts.length === 0 ? (
                <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center h-32 border border-dashed border-gray-200">
                   <Store className="w-6 h-6 text-gray-300 mb-2" />
                   <div className="text-[12px] text-gray-400">尚未上架商品</div>
                </div>
             ) : (
                 appState.meituanProducts.map((prod, idx) => (
                   <div key={idx} className="bg-white rounded-xl p-3 shadow-sm flex gap-3 relative animate-in slide-in-from-bottom-2 border border-transparent hover:border-[#FF9900]/20 transition-all">
                      <div className="w-[90px] h-[90px] rounded-lg bg-gray-100 shrink-0 overflow-hidden relative border border-gray-100">
                         <img src={prod.image} className="w-full h-full object-cover" alt="商品" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=400&q=80'; }} />
                      </div>
                      <div className="flex-1 flex flex-col justify-between py-0.5 pr-1 overflow-hidden">
                         <div>
                           <div className="text-[13px] font-bold text-gray-900 line-clamp-2 leading-snug mb-1">{prod.title}</div>
                           <div className="flex flex-wrap gap-1 mb-1.5">
                              {bv.tags.slice(0,2).map(tag => <span key={tag} className="text-[9px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 whitespace-nowrap">{tag}</span>)}
                           </div>
                         </div>
                         <div className="flex items-center justify-between mt-1 gap-1">
                            <div className="font-bold flex items-baseline shrink-0" style={{ color: '#FF4500' }}>
                               <span className="text-[10px]">¥</span>
                               <span className="text-[14px] leading-none mx-0.5">{prod.price}</span>
                               <span className="text-[9px] font-normal text-gray-500">起</span>
                            </div>
                            <button className="px-2.5 py-1 rounded-full text-[11px] text-white font-bold shadow-sm whitespace-nowrap shrink-0 hover:opacity-90" style={{ backgroundColor: '#FF6600' }}>预约</button>
                         </div>
                      </div>
                   </div>
                 ))
             )}
          </div>
        </div>
      </div>
    );
  };

  const renderXiaohongshuMockup = () => {
      const bv = appState.brandVisual;
      
      if (!appState.xiaohongshuProfileDesc) {
        return (
           <div className="h-full bg-white flex flex-col items-center justify-center text-gray-400 p-6 text-center">
             <Smartphone className="w-10 h-10 mb-3 opacity-20 mx-auto text-[#FF2442]" />
             <p className="text-[13px] font-bold text-gray-800 mb-1">小红书主页未搭建</p>
             <p className="text-[11px] text-gray-500">请在左侧对话框完善主页风格诉求</p>
           </div>
        );
      }

      if (appState.xhsCurrentView === 'detail' && appState.activeXhsPost) {
         const post = appState.activeXhsPost;
         return (
            <div className="h-full bg-white flex flex-col animate-in slide-in-from-right-8 duration-300" style={{ fontFamily: bv.fontBody, color: bv.text }}>
               <div className="absolute top-12 left-4 z-20 w-8 h-8 bg-black/40 backdrop-blur rounded-full flex items-center justify-center text-white cursor-pointer hover:bg-black/60 transition-colors"
                    onClick={() => setAppState(prev => ({...prev, xhsCurrentView: 'profile'}))}>
                  <ChevronRight className="w-5 h-5 rotate-180" />
               </div>
               
               <div className="h-[55%] relative bg-gray-100 shrink-0">
                  <img src={post.image} alt="笔记配图" className="w-full h-full object-cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1537151608804-ea2f1a79fd22?auto=format&fit=crop&w=800&q=80'; }} />
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                     <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                     <div className="w-1.5 h-1.5 rounded-full bg-white/50"></div>
                  </div>
               </div>

               <div className="flex-1 overflow-y-auto bg-white p-4">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
                     <div className="flex items-center gap-2 overflow-hidden">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm overflow-hidden border border-gray-100 shrink-0">
                           <img src={bv.images.logo} className="w-full h-full object-cover" alt="logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80'; }} />
                        </div>
                        <span className="text-[13px] font-bold text-gray-900 truncate">{appState.shopName}</span>
                     </div>
                     <button className="px-3 py-1 rounded-full text-[11px] text-[#FF2442] border border-[#FF2442] font-bold shrink-0 ml-2">关注</button>
                  </div>

                  <h1 className="text-[15px] font-bold text-gray-900 leading-snug mb-3">{post.title}</h1>
                  <p className="text-[13px] text-gray-700 leading-relaxed mb-4 whitespace-pre-wrap">{post.desc}</p>
                  
                  <div className="flex flex-wrap gap-2 mb-6">
                     {post.tags.map(tag => (
                        <span key={tag} className="text-[12px] text-[#0066FF] font-medium">#{tag}</span>
                     ))}
                  </div>
                  
                  <div className="text-[10px] text-gray-400">今天 12:00</div>
               </div>
            </div>
         );
      }

      return (
        <div className="h-full bg-white flex flex-col animate-in fade-in duration-500" style={{ fontFamily: bv.fontBody, color: bv.text }}>
          <div className="h-48 relative flex items-end p-4 bg-cover bg-center overflow-hidden shrink-0">
            <img
              src="https://github.com/user-attachments/assets/0d17b64f-b735-4208-9653-3c5375a1d72e"
              className="absolute inset-0 w-full h-full object-cover"
              alt="小红书主页背景"
              onError={(e) => {
                e.currentTarget.onerror = null;
                e.currentTarget.src =
                  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80';
              }}
            />
            <div className="absolute inset-0 bg-black/20 z-10"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent z-10"></div>
            <div className="flex flex-col gap-2 z-20 w-full relative mb-1">
              <div className="w-14 h-14 rounded-full border-2 border-white shadow-md flex items-center justify-center overflow-hidden mb-1 bg-white">
                 <img src={bv.images.logo} className="w-full h-full object-cover" alt="logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80'; }} />
              </div>
              <div className="text-white">
                <h2 className="font-bold text-[16px] drop-shadow-md truncate">{appState.shopName}</h2>
                <p className="text-[10px] text-white/90 mt-0.5 drop-shadow">小红书号: 88888888</p>
              </div>
            </div>
          </div>
          <div className="px-4 py-2.5 text-[11px] text-gray-700 border-b border-gray-100 truncate shrink-0">{appState.shopSlogan}</div>
          
          <div className="flex gap-6 px-4 py-2.5 text-[12px] font-bold text-gray-500 border-b border-gray-100 shadow-sm shrink-0">
             <span className="text-gray-900 relative">
               笔记
               <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[#FF2442] rounded-full"></div>
             </span>
             <span>收藏</span>
             <span>赞过</span>
          </div>

          <div className="flex-1 p-2 bg-gray-50 overflow-y-auto">
             {appState.xiaohongshuPosts.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 pt-8">
                   <Edit2 className="w-6 h-6 mb-2 opacity-20" />
                   <div className="text-[11px] font-medium text-gray-600">主页已就绪</div>
                   <div className="text-[9px] mt-1">等待发布第一篇种草笔记</div>
                </div>
             ) : (
                <div className="grid grid-cols-2 gap-2 pb-10">
                   {appState.xiaohongshuPosts.map((post, idx) => (
                     <div key={idx} onClick={() => { setAppState(prev=>({...prev, activeXhsPost: post, xhsCurrentView: 'detail'})) }}
                          className="bg-white rounded-xl overflow-hidden shadow-sm flex flex-col cursor-pointer hover:shadow-md transition-shadow animate-in zoom-in-95 border border-gray-100">
                       <div className="aspect-[3/4] relative overflow-hidden group">
                         <img src={post.image} alt="封面" className="w-full h-full object-cover transition-transform group-hover:scale-105" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1537151608804-ea2f1a79fd22?auto=format&fit=crop&w=400&q=80'; }} />
                       </div>
                       <div className="p-2">
                         <div className="text-[11px] font-bold line-clamp-2 leading-relaxed text-gray-900 mb-1.5">
                           {post.title}
                         </div>
                         <div className="flex items-center justify-between text-[9px] text-gray-500">
                            <div className="flex items-center gap-1 overflow-hidden">
                               <div className="w-3.5 h-3.5 rounded-full overflow-hidden bg-white shadow-sm border border-gray-100 shrink-0">
                                  <img src={bv.images.logo} className="w-full h-full object-cover" alt="logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80'; }} />
                               </div>
                               <span className="truncate w-10">{appState.shopName}</span>
                            </div>
                            <span className="flex items-center gap-0.5 shrink-0">♡ 128</span>
                         </div>
                       </div>
                     </div>
                   ))}
                </div>
             )}
          </div>
        </div>
      );
    };

  const renderWechatMockup = () => {
       const bv = appState.brandVisual;
       if (!appState.socialEvent) {
        return (
           <div className="h-full bg-white flex flex-col items-center justify-center text-gray-400 p-6 text-center">
             <Smartphone className="w-10 h-10 mb-3 opacity-20 mx-auto text-[#07C160]" />
             <p className="text-[13px] font-bold text-gray-800 mb-1">朋友圈海报未生成</p>
             <p className="text-[11px] text-gray-500">请在左侧输入你想做的营销活动</p>
           </div>
        );
       }
       return (
        <div className="h-full bg-white flex flex-col animate-in fade-in duration-500" style={{ fontFamily: bv.fontBody, color: bv.text }}>
            <div className="h-48 relative flex items-end justify-end p-4 mb-8 overflow-hidden shrink-0">
               <img src="https://github.com/user-attachments/assets/768bd141-edeb-4b12-841d-4a44df1e4b67" className="absolute inset-0 w-full h-full object-cover" alt="cover" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=800&q=80'; }} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10"></div>
               <div className="absolute -bottom-6 right-4 flex items-center gap-3 z-20">
                  <span className="text-white font-bold text-shadow drop-shadow-md text-[14px] pb-4 truncate max-w-[120px]">{appState.shopName}</span>
                  <div className="w-14 h-14 rounded-lg bg-white flex items-center justify-center font-bold shadow-md overflow-hidden border-2 border-white shrink-0">
                      <img src={bv.images.logo} className="w-full h-full object-cover" alt="logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80'; }} />
                  </div>
               </div>
            </div>
            
            <div className="px-4 py-3 bg-white flex gap-2 border-b border-gray-100 flex-1 overflow-y-auto">
               <div className="w-8 h-8 rounded-md shrink-0 flex items-center justify-center text-sm font-bold shadow-sm bg-white overflow-hidden border border-gray-100">
                  <img src={bv.images.logo} className="w-full h-full object-cover" alt="logo" onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.unsplash.com/photo-1599447421416-3414500d18a5?auto=format&fit=crop&w=400&q=80'; }} />
               </div>
               <div className="flex-1 overflow-hidden">
                 <div className="font-bold text-[#576B95] text-[13px] truncate">{appState.shopName}</div>
                 <div className="text-[12px] text-gray-800 leading-relaxed whitespace-pre-wrap">
                 {`🐾 给 TA 一次温柔而精致的护理体验
✨ 爱宠 SPA，打造专属宠物的品质生活
🤍 让每一次陪伴，都值得被认真呵护`}
                 </div>
                 <div className="w-40 rounded-md overflow-hidden shadow-sm border border-gray-100 bg-gray-100 mt-1">
                   <img
                     src={bv.images.wechatPoster || bv.images.banner}
                     className="block w-full h-auto object-contain"
                     alt="海报"
                     onError={(e) => {
                       e.currentTarget.onerror = null;
                       e.currentTarget.src =
                         'https://images.unsplash.com/photo-1583337130417-3346a1be7dee?auto=format&fit=crop&w=800&q=80';
                     }}
                   />
                 </div>
                 <div className="flex items-center justify-between text-[10px] text-gray-400 mt-2">
                    <span>1分钟前</span>
                    <div className="bg-[#F5F5F5] px-1.5 py-0.5 rounded text-[#576B95] font-bold tracking-widest">..</div>
                 </div>
               </div>
            </div>
        </div>
      );
    };

  const renderPreviewPanel = () => {
    return (
      <div className="h-full w-full flex flex-col bg-[#FAFAFA] overflow-hidden p-6 relative">
        
        {appState.brandVisual && (
          <div className="flex justify-center mb-4 z-20 shrink-0">
            <div className="flex bg-white rounded-full shadow-sm p-1 border border-[#F5F1EF]">
              {['meituan', 'xiaohongshu', 'wechat'].map(id => (
                <button
                  key={id}
                  onClick={() => setPreviewPlatform(id)}
                  className={`px-6 py-1.5 rounded-full text-[12px] font-bold transition-all ${
                    previewPlatform === id ? 'bg-[#FFF5F0] text-[#D49887] shadow-sm' : 'text-[#A69B95] hover:text-[#4A3C31]'
                  }`}
                >
                  {id === 'meituan' ? '美团' : id === 'xiaohongshu' ? '小红书' : '微信'}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 flex items-start justify-center overflow-y-auto w-full pb-8 z-10">
          <div className="relative w-[280px] max-h-[85vh] h-[580px] bg-white rounded-[2.5rem] p-2 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.05)] border-[6px] border-white flex-shrink-0 flex flex-col ring-1 ring-gray-100">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-5 bg-white rounded-b-2xl z-30 flex justify-center">
              <div className="w-10 h-1 bg-gray-200 rounded-full mt-1.5"></div>
            </div>

            <div className="flex-1 w-full bg-[#FAFAFA] rounded-[2rem] overflow-hidden relative border border-gray-100">
               {!appState.brandVisual ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-gray-400 bg-white">
                    <div className="w-16 h-16 bg-[#FFF5F0] rounded-2xl flex items-center justify-center mb-4 shadow-sm border border-[#FDF2E9]">
                       <ImageIcon className="w-6 h-6 text-[#EACAC0]" />
                    </div>
                    <p className="text-[14px] font-bold text-[#4A3C31] mb-1.5">品牌视觉预览区</p>
                    <p className="text-[11px] text-[#A69B95] leading-relaxed">完成品牌资产后<br/>将在此实时预览效果</p>
                  </div>
               ) : (
                  <>
                    {previewPlatform === 'meituan' && renderMeituanMockup()}
                    {previewPlatform === 'xiaohongshu' && renderXiaohongshuMockup()}
                    {previewPlatform === 'wechat' && renderWechatMockup()}
                  </>
               )}
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-10 shrink-0">
           <span className="text-[10px] text-[#A69B95] flex items-center justify-center gap-1.5">
             <Info className="w-3 h-3" /> 预览效果将随品牌资产生成实时更新
           </span>
        </div>
      </div>
    );
  };

  return (
    <div className="flex w-screen h-screen overflow-hidden bg-white text-gray-900 font-sans">
      <div className="w-[38%] min-w-[380px] h-full flex-shrink-0 relative z-30 shadow-sm border-r border-[#F5F1EF] bg-[#FFFCFA]">
        {renderChatPanel()}
      </div>
      
      <div className="w-[32%] min-w-[320px] h-full flex-shrink-0 shadow-[4px_0_24px_rgba(0,0,0,0.02)] z-20 relative bg-white border-r border-[#F5F1EF]">
        {renderDetailPanel()}
      </div>
      
      <div className="flex-1 min-w-[300px] h-full relative z-10 flex flex-col bg-white">
        <div className="h-16 w-full flex items-center px-6 shrink-0 z-20 border-b border-[#F5F1EF]">
            <span className="font-bold text-[#4A3C31] tracking-wide text-[16px] flex items-center gap-2">
              <Monitor className="w-4 h-4 text-[#A69B95]" />
              平台预览
            </span>
        </div>
        <div className="flex-1 w-full bg-[#FAFAFA] relative dot-pattern overflow-hidden">
           <style>{`
              .dot-pattern {
                 background-image: radial-gradient(#F5F1EF 1px, transparent 1px);
                 background-size: 20px 20px;
              }
           `}</style>
          {renderPreviewPanel()}
        </div>
      </div>
    </div>
  );
}

