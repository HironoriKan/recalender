import React, { useState, useEffect, useRef } from 'react';

const CalendarTextGenerator = () => {
  const weekdays = ['月', '火', '水', '木', '金', '土', '日'];
  const timeSlots = Array.from({ length: 14 }, (_, i) => `${i + 8}:00`);
  const [selectedDates, setSelectedDates] = useState(new Map());
  const [generatedText, setGeneratedText] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDates, setWeekDates] = useState([]);
  const today = new Date();
  const [isDragging, setIsDragging] = useState(false);
  const [dragOperation, setDragOperation] = useState(null);
  const [longPressTimer, setLongPressTimer] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const [showCalendarPopup, setShowCalendarPopup] = useState(false);
  const [popupMonth, setPopupMonth] = useState(new Date());
  const popupRef = useRef();
  const [currentTimePosition, setCurrentTimePosition] = useState(0);
  const [isTextAreaFocused, setIsTextAreaFocused] = useState(false);
  const textAreaRef = useRef(null);

  // Custom hook for viewport height
  const useViewportHeight = () => {
    const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
      const handleResize = () => {
        const vh = window.innerHeight;
        const previousHeight = viewportHeight;
        
        if (previousHeight - vh > 100) {
          setIsKeyboardVisible(true);
          setKeyboardHeight(previousHeight - vh);
        } else if (vh - previousHeight > 100) {
          setIsKeyboardVisible(false);
          setKeyboardHeight(0);
        }
        
        setViewportHeight(vh);
        document.documentElement.style.setProperty('--vh', `${vh * 0.01}px`);
      };

      handleResize();
      window.addEventListener('resize', handleResize);
      window.addEventListener('orientationchange', () => {
        setTimeout(handleResize, 100);
      });
      window.addEventListener('scroll', () => {
        setTimeout(handleResize, 100);
      });

      return () => {
        window.removeEventListener('resize', handleResize);
        window.removeEventListener('orientationchange', handleResize);
        window.removeEventListener('scroll', handleResize);
      };
    }, [viewportHeight]);

    return { viewportHeight, isKeyboardVisible, keyboardHeight };
  };

  const { viewportHeight, isKeyboardVisible, keyboardHeight } = useViewportHeight();

  // Week dates calculation
  useEffect(() => {
    const currentDay = new Date(currentDate);
    const day = currentDay.getDay();
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const monday = new Date(currentDay);
    monday.setDate(currentDay.getDate() + mondayOffset);
    
    const dates = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      dates.push(date);
    }
    
    setWeekDates(dates);
  }, [currentDate]);

  // Navigation functions
  const previousWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const nextWeek = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  // Date-time key generation
  const getDateTimeKey = (date, timeIndex) => {
    const d = new Date(date);
    d.setHours(timeIndex + 8, 0, 0, 0);
    return d.toISOString();
  };

  // Cell interaction handlers
  const handleCellClick = (dayIndex, timeIndex) => {
    if (isLongPress) return;
    
    const date = weekDates[dayIndex];
    if (!date) return;

    const key = getDateTimeKey(date, timeIndex);
    const newSelectedDates = new Map(selectedDates);
    
    if (selectedDates.has(key)) {
      newSelectedDates.delete(key);
    } else {
      newSelectedDates.set(key, true);
    }
    
    setSelectedDates(newSelectedDates);
  };

  const handleCellMouseDown = (dayIndex, timeIndex) => {
    const timer = setTimeout(() => {
      const date = weekDates[dayIndex];
      if (!date) return;

      const key = getDateTimeKey(date, timeIndex);
      const newSelectedDates = new Map(selectedDates);
      const newValue = !selectedDates.has(key);
      
      if (newValue) {
        newSelectedDates.set(key, true);
      } else {
        newSelectedDates.delete(key);
      }
      
      setSelectedDates(newSelectedDates);
      setIsDragging(true);
      setDragOperation(newValue);
      setIsLongPress(true);
    }, 500);
    
    setLongPressTimer(timer);
  };

  const handleCellMouseEnter = (dayIndex, timeIndex) => {
    if (isDragging && dragOperation !== null) {
      const date = weekDates[dayIndex];
      if (!date) return;

      const key = getDateTimeKey(date, timeIndex);
      const newSelectedDates = new Map(selectedDates);
      
      if (dragOperation) {
        newSelectedDates.set(key, true);
      } else {
        newSelectedDates.delete(key);
      }
      
      setSelectedDates(newSelectedDates);
    }
  };

  const handleMouseUp = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
    
    if (isDragging) {
      setIsDragging(false);
      setDragOperation(null);
      
      setTimeout(() => {
        setIsLongPress(false);
      }, 50);
    }
  };

  // Touch event handlers
  const handleTouchMove = (e) => {
    if (!isLongPress) return;
    
    if (isDragging) {
      const touch = e.touches[0];
      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      
      if (element && element.dataset.dayIndex !== undefined && element.dataset.timeIndex !== undefined) {
        e.preventDefault();
        
        const dayIndex = parseInt(element.dataset.dayIndex);
        const timeIndex = parseInt(element.dataset.timeIndex);
        handleCellMouseEnter(dayIndex, timeIndex);
      }
    }
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  // Text generation
  const generateText = (dates = selectedDates) => {
    let text = '';
    const dateGroups = new Map();
    
    dates.forEach((_, key) => {
      const date = new Date(key);
      const dateKey = date.toDateString();
      const hour = date.getHours();
      
      if (!dateGroups.has(dateKey)) {
        dateGroups.set(dateKey, []);
      }
      dateGroups.get(dateKey).push(hour);
    });

    const sortedDates = Array.from(dateGroups.keys()).sort((a, b) => new Date(a) - new Date(b));
    
    sortedDates.forEach(dateKey => {
      const date = new Date(dateKey);
      const hours = dateGroups.get(dateKey).sort((a, b) => a - b);
      
      if (hours.length > 0) {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const jpWeekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];
        
        text += `${month}月${day}日(${jpWeekday}) `;
        
        let startHour = null;
        let endHour = null;
        
        hours.forEach(hour => {
          if (startHour === null) {
            startHour = hour;
            endHour = hour + 1;
          } else if (hour === endHour) {
            endHour = hour + 1;
          } else {
            text += `${startHour}:00-${endHour}:00 `;
            startHour = hour;
            endHour = hour + 1;
          }
        });
        
        if (startHour !== null) {
          text += `${startHour}:00-${endHour}:00 `;
        }
        
        text += '\n';
      }
    });
    
    setGeneratedText(text.trim());
  };

  // Effect for text generation
  useEffect(() => {
    generateText();
  }, [selectedDates, weekDates]);

  // Utility functions
  const resetSelection = () => {
    setSelectedDates(new Map());
    setGeneratedText('');
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(generatedText)
      .then(() => {
        alert('テキストをコピーしました');
      })
      .catch(err => {
        console.error('コピーに失敗しました', err);
      });
  };

  const isMobileDevice = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Selected slots calculation
  const getSelectedSlots = () => {
    const slots = Array(7).fill().map(() => Array(14).fill(false));
    
    weekDates.forEach((date, dayIndex) => {
      if (!date) return;
      
      for (let timeIndex = 0; timeIndex < 14; timeIndex++) {
        const key = getDateTimeKey(date, timeIndex);
        if (selectedDates.has(key)) {
          slots[dayIndex][timeIndex] = true;
        }
      }
    });
    
    return slots;
  };

  // Calendar popup rendering
  const renderCalendarPopup = () => {
    if (!showCalendarPopup) return null;
    
    const firstDayOfMonth = new Date(popupMonth.getFullYear(), popupMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(popupMonth.getFullYear(), popupMonth.getMonth() + 1, 0);
    let firstDayOfWeek = firstDayOfMonth.getDay();
    firstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    const daysInMonth = lastDayOfMonth.getDate();
    const lastDayOfPrevMonth = new Date(popupMonth.getFullYear(), popupMonth.getMonth(), 0);
    const daysInPrevMonth = lastDayOfPrevMonth.getDate();
    const rows = Math.ceil((firstDayOfWeek + daysInMonth) / 7);
    const weekdaysForPopup = ['月', '火', '水', '木', '金', '土', '日'];
    
    return (
      <div 
        ref={popupRef}
        className="absolute top-10 left-0 bg-white shadow-lg rounded-lg z-50 p-2"
        style={{ 
          width: '300px',
          border: '1px solid #CB8585'
        }}
      >
        <div className="flex justify-between items-center mb-2">
          <button 
            onClick={() => {
              const newMonth = new Date(popupMonth);
              newMonth.setMonth(popupMonth.getMonth() - 1);
              setPopupMonth(newMonth);
            }}
            className="p-1"
          >
            &lt;
          </button>
          <div className="font-bold">
            {popupMonth.getFullYear()}年{popupMonth.getMonth() + 1}月
          </div>
          <button 
            onClick={() => {
              const newMonth = new Date(popupMonth);
              newMonth.setMonth(popupMonth.getMonth() + 1);
              setPopupMonth(newMonth);
            }}
            className="p-1"
          >
            &gt;
          </button>
        </div>
        
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {weekdaysForPopup.map((day, index) => (
                <th key={index} className="text-center text-xs p-1">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIndex) => (
              <tr key={rowIndex}>
                {Array.from({ length: 7 }).map((_, colIndex) => {
                  const dayNumber = rowIndex * 7 + colIndex - firstDayOfWeek + 1;
                  const isCurrentMonth = dayNumber > 0 && dayNumber <= daysInMonth;
                  const prevMonthDay = daysInPrevMonth - firstDayOfWeek + colIndex + 1;
                  const nextMonthDay = dayNumber - daysInMonth;
                  const displayDay = isCurrentMonth 
                    ? dayNumber 
                    : (dayNumber <= 0 ? prevMonthDay : nextMonthDay);
                  
                  let dateObj;
                  if (isCurrentMonth) {
                    dateObj = new Date(popupMonth.getFullYear(), popupMonth.getMonth(), dayNumber);
                  } else if (dayNumber <= 0) {
                    dateObj = new Date(popupMonth.getFullYear(), popupMonth.getMonth() - 1, prevMonthDay);
                  } else {
                    dateObj = new Date(popupMonth.getFullYear(), popupMonth.getMonth() + 1, nextMonthDay);
                  }
                  
                  const isToday = dateObj.getDate() === today.getDate() && 
                                dateObj.getMonth() === today.getMonth() && 
                                dateObj.getFullYear() === today.getFullYear();
                  
                  const isInSelectedWeek = weekDates.some(date => 
                    date.getDate() === dateObj.getDate() && 
                    date.getMonth() === dateObj.getMonth() && 
                    date.getFullYear() === dateObj.getFullYear()
                  );
                  
                  return (
                    <td 
                      key={colIndex} 
                      className={`text-center p-1 cursor-pointer ${
                        isCurrentMonth ? '' : 'text-gray-400'
                      } ${
                        isInSelectedWeek ? 'bg-red-100' : ''
                      }`}
                      onClick={() => {
                        setCurrentDate(dateObj);
                        setShowCalendarPopup(false);
                      }}
                    >
                      <div className={`inline-block w-6 h-6 ${
                        isToday ? 'bg-red-400 text-white rounded-full flex items-center justify-center' : ''
                      }`}>
                        {displayDay}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Current time position calculation
  useEffect(() => {
    const calculateTimePosition = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      if (hours >= 8 && hours < 22) {
        const fiveMinuteInterval = Math.floor(minutes / 5);
        const cellHeight = 48;
        const hourPosition = (hours - 8) * cellHeight;
        const minutePosition = (fiveMinuteInterval * 5 / 60) * cellHeight;
        
        setCurrentTimePosition(hourPosition + minutePosition);
      } else {
        setCurrentTimePosition(-1);
      }
    };
    
    calculateTimePosition();
    const interval = setInterval(calculateTimePosition, 60000);
    
    return () => clearInterval(interval);
  }, []);

  // Click outside popup handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popupRef.current && !popupRef.current.contains(event.target)) {
        setShowCalendarPopup(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [popupRef]);

  // Document-level event listeners
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);
    
    return () => {
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, []);

  // Touch event handler for document
  useEffect(() => {
    const handleDocumentTouchMove = (e) => {
      if (isDragging) {
        e.preventDefault();
      }
    };
    
    document.addEventListener('touchmove', handleDocumentTouchMove, { passive: false });
    
    return () => {
      document.removeEventListener('touchmove', handleDocumentTouchMove);
    };
  }, [isDragging]);

  // Text area focus handler
  const handleTextAreaFocus = () => {
    setIsTextAreaFocused(true);
    
    if (textAreaRef.current) {
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
      const delay = isIOS ? 500 : 300;
      
      setTimeout(() => {
        window.scrollTo({
          top: document.body.scrollHeight,
          behavior: 'smooth'
        });
        
        textAreaRef.current.scrollIntoView({ 
          behavior: 'smooth', 
          block: 'center' 
        });
      }, delay);
    }
  };

  return (
    <div className="flex justify-center bg-gray-50 w-full" style={{ 
      minHeight: '100vh', 
      minHeight: 'calc(var(--vh, 1vh) * 100)', 
      overscrollBehavior: 'auto',
      position: 'relative'
    }}>
      <div 
        className="flex flex-col bg-white w-full max-w-[400px] shadow-md" 
        style={{ 
          height: isKeyboardVisible ? 'auto' : '100vh', 
          height: isKeyboardVisible ? 'auto' : 'calc(var(--vh, 1vh) * 100)',
          position: 'relative',
          maxWidth: '400px',
          width: '100%',
          overflow: isKeyboardVisible ? 'visible' : 'hidden'
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseUp={handleMouseUp}
      >
        {/* Header */}
        <div className="bg-white p-2 flex justify-center items-center shadow-sm">
          <div className="flex items-center">
            <div className="text-lg font-medium flex items-center">
              <span className="font-bold text-gray-700">カレンダー日程調整</span>
            </div>
          </div>
        </div>
        
        {/* Calendar navigation */}
        <div className="bg-white flex justify-between items-center p-2 border-b border-gray-200">
          <div className="flex items-center relative">
            <button 
              onClick={() => {
                setShowCalendarPopup(!showCalendarPopup);
                setPopupMonth(new Date(currentDate));
              }}
              className="flex items-center"
            >
              <span className="text-lg font-bold mr-1">
                {weekDates.length > 0 ? `${weekDates[0].getMonth() + 1}月` : ''}
              </span>
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-4 h-4">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {renderCalendarPopup()}
          </div>
          
          <div className="flex items-center justify-center" style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}>
            <button onClick={previousWeek} className="px-2 text-gray-500 text-lg">&lt;</button>
            <button onClick={goToToday} className="px-2 text-gray-500 text-sm font-bold">今日</button>
            <button onClick={nextWeek} className="px-2 text-gray-500 text-lg">&gt;</button>
          </div>
          
          <div></div>
        </div>
        
        {/* Calendar grid */}
        <div className="bg-white p-0 mb-0 flex-1 flex flex-col overflow-hidden min-h-0" style={{
          maxHeight: isKeyboardVisible ? '40vh' : 'none',
          transition: 'max-height 0.3s ease'
        }}>
          {/* Fixed header */}
          <table className="w-full border-collapse table-fixed" style={{ margin: '8px 0 4px 0' }}>
            <thead>
              <tr className="border-b-[8px] border-white">
                <th className="w-[50px] p-0"></th>
                {weekdays.map((weekday, index) => {
                  const date = weekDates[index];
                  const isToday = date && 
                    date.getDate() === today.getDate() && 
                    date.getMonth() === today.getMonth() && 
                    date.getFullYear() === today.getFullYear();
                  
                  return (
                    <th key={index} className="p-0 text-center border-l-[8px] border-r-[8px] border-white">
                      <div className="text-xs text-gray-500">{weekday}</div>
                      <div style={{ marginTop: '4px' }} className="flex justify-center">
                        <div className={`text-base font-bold w-10 h-10 flex items-center justify-center ${isToday ? 'bg-red-400 text-white rounded-full' : ''}`}>
                          {date ? date.getDate() : ''}
                        </div>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
          </table>
          
          {/* Scrollable body */}
          <div 
            className="overflow-auto relative flex-1" 
            style={{ 
              WebkitOverflowScrolling: 'touch',
              overscrollBehavior: 'auto'
            }}
          >
            {/* Current time indicator */}
            {currentTimePosition >= 0 && (
              <>
                <div 
                  className="absolute z-10 pointer-events-none" 
                  style={{ 
                    top: `${currentTimePosition - 5}px`, 
                    left: '42px',
                    width: '0',
                    height: '0',
                    borderTop: '5px solid transparent',
                    borderBottom: '5px solid transparent',
                    borderLeft: '8px solid rgba(255, 0, 0, 0.6)'
                  }}
                />
                <div 
                  className="absolute z-10 pointer-events-none" 
                  style={{ 
                    top: `${currentTimePosition}px`, 
                    height: '0.5px', 
                    backgroundColor: 'rgba(255, 0, 0, 0.6)',
                    left: '50px',
                    right: '0'
                  }}
                />
              </>
            )}
            
            {/* Time slots */}
            <table className="w-full border-collapse table-fixed">
              <tbody>
                {timeSlots.map((time, timeIndex) => (
                  <tr key={timeIndex} className="border-b-[8px] border-white">
                    <td className="w-[50px] p-0 text-xs text-gray-500 text-center align-middle">
                      {time}
                    </td>
                    {weekdays.map((_, dayIndex) => (
                      <td 
                        key={dayIndex} 
                        className="relative p-0 border-l-[8px] border-r-[8px] border-white select-none cursor-pointer"
                        onClick={() => handleCellClick(dayIndex, timeIndex)}
                        onMouseDown={() => handleCellMouseDown(dayIndex, timeIndex)}
                        onMouseEnter={() => isDragging && handleCellMouseEnter(dayIndex, timeIndex)}
                        onTouchStart={() => handleCellMouseDown(dayIndex, timeIndex)}
                        data-day-index={dayIndex}
                        data-time-index={timeIndex}
                      >
                        <div className="flex justify-center">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            getSelectedSlots()[dayIndex][timeIndex] ? 'bg-red-300' : 'bg-red-100'
                          }`}>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        {/* Bottom fixed area */}
        <div className="bg-white border-t border-gray-200 flex flex-col" style={{
          position: isKeyboardVisible ? 'sticky' : 'relative',
          bottom: 0,
          zIndex: 10,
          backgroundColor: 'white'
        }}>
          {/* Selected time text display */}
          <div className="bg-white" style={{ 
            height: '75px',
            position: isKeyboardVisible ? 'sticky' : 'relative',
            bottom: 0
          }}>
            <div 
              ref={textAreaRef}
              className="text-sm text-gray-800 h-full p-2 overflow-y-auto"
              contentEditable={!isMobileDevice()}
              suppressContentEditableWarning={true}
              onFocus={!isMobileDevice() ? handleTextAreaFocus : undefined}
              onBlur={!isMobileDevice() ? (e) => {
                setIsTextAreaFocused(false);
                setGeneratedText(e.currentTarget.textContent);
                
                setTimeout(() => {
                  window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                  });
                }, 100);
              } : undefined}
              style={{ 
                fontSize: '16px',
                backgroundColor: isTextAreaFocused ? '#f8f8f8' : 'white',
                userSelect: isMobileDevice() ? 'none' : 'text',
                WebkitUserSelect: isMobileDevice() ? 'none' : 'text',
                MozUserSelect: isMobileDevice() ? 'none' : 'text',
                msUserSelect: isMobileDevice() ? 'none' : 'text',
                cursor: isMobileDevice() ? 'default' : 'text'
              }}
            >
              {generatedText ? (
                generatedText.split('\n').map((line, index) => (
                  <div key={index}>{line}</div>
                ))
              ) : (
                <div className="text-gray-400">
                  カレンダーで選択した日時が、自動で入力されます。
                  {isMobileDevice() && <div className="mt-1 text-xs">※モバイル版では編集できません</div>}
                </div>
              )}
            </div>
          </div>
          
          {/* Footer buttons */}
          <div 
            className={`bg-white p-1 flex justify-center items-center border-t border-gray-200 ${
              isKeyboardVisible ? 'hidden' : 'block'
            }`}
          >
            <div className="flex space-x-3">
              <button 
                onClick={resetSelection}
                className="px-10 bg-gray-300 text-gray-700 rounded-full text-sm h-10 font-bold"
                style={{ margin: '20px 12px' }}
              >
                リセット
              </button>
              
              <button 
                onClick={copyToClipboard}
                className="px-10 bg-red-400 text-white rounded-full text-sm h-10 font-bold"
                style={{ margin: '20px 12px' }}
                disabled={!generatedText}
              >
                文字をコピー
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarTextGenerator;