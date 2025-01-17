import React, { useEffect, useRef, useState } from 'react';
import { CSSTransition } from 'react-transition-group';
import Scroll from '../../../baseUI/scroll/index'
import {
  PlayListWrapper,
  ListHeader,
  ListContent,
  ScrollWrapper
} from './style';
import { connect } from "react-redux";
import { useCallback } from 'react';
import {
  changeShowPlayList,
  changePlayMode,
  deleteSong,
  changeSequecePlayList,
  colloctInsertSong,
  colloctDeleteSong
} from '../store/actionCreators';
import { getName, shuffle, findIndex } from '../../../api/utils';
import { changeCurrentSong, changeCurrentIndex, changePlayList, changePlayingState } from './../store/actionCreators';
import { playMode } from './../../../api/config';
import { prefixStyle } from './../../../api/utils';
import Confirm from './../../../baseUI/confirm/index';

function PlayList(props) {
  const [isShow, setIsShow] = useState(false);
  const [canTouch, setCanTouch] = useState(true);
  const [startY, setStartY] = useState(0);
  const [initialed, setInitialed] = useState(0);
  const [distance, setDistance] = useState(0);
  const [isShowColloct, setShowColloctList] = useState(false)
  const transform = prefixStyle("transform");
  const colloctListRef = useRef();
  const listContentRef = useRef();
  const listWrapperRef = useRef();
  const playListRef = useRef();
  const confirmRef = useRef();

  const {
    currentIndex,
    currentSong: immutableCurrentSong,
    showPlayList,
    playList: immutablePlayList,
    mode,
    sequencePlayList: immutableSequencePlayList,
    colloctList: immutableColloctList,
    colloctSequencePlayList: immutableCollectSequencePlayList,
    colloctCurrentIndex,
    colloctSong: immutableColloctSong
  } = props;

  const { clearPreSong } = props; //清空PreSong

  const {
    togglePlayListDispatch,
    changeCurrentIndexDispatch,
    changePlayListDispatch,
    changeModeDispatch,
    deleteSongDispatch,
    clearDispatch,
    deleteColloctSong,
    insetColloctSong
  } = props;

  useEffect(() => {
    colloctListRef.current = {immutableColloctList}
  }, [immutableColloctList]);
  
  useEffect(() => {
    window.addEventListener("beforeunload", function (e) {
      const { immutableColloctList } = colloctListRef.current;
      window.sessionStorage.setItem("colloctList",JSON.stringify( immutableColloctList.toJS()))
    });

    return () => {
      window.removeEventListener('beforeunload', (e) => { })
    }
  }, [colloctListRef]);

  const currentSong = isShowColloct ? immutableColloctSong.toJS() : immutableCurrentSong.toJS();
  const playList = isShowColloct ? immutableColloctList.toJS() : immutablePlayList.toJS();
  const sequencePlayList = isShowColloct ? immutableCollectSequencePlayList.toJS() : immutableSequencePlayList.toJS();
  const playIndex = isShowColloct ? colloctCurrentIndex : currentIndex;

  const changeMode = (e) => {
    let newMode = (mode + 1) % 3;
    if (newMode === 0) {
      changePlayListDispatch(sequencePlayList);
      let index = findIndex(currentSong, sequencePlayList);
      changeCurrentIndexDispatch(index);
    } else if (newMode === 1) {
      changePlayListDispatch(sequencePlayList);
    } else if (newMode === 2) {
      let newList = shuffle(sequencePlayList);
      let index = findIndex(currentSong, newList);
      changePlayListDispatch(newList);
      changeCurrentIndexDispatch(index);
    }
    changeModeDispatch(newMode);
  }

  const handleChangeCurrentIndex = (index) => {
    if (playIndex === index) return;
    changeCurrentIndexDispatch(index);
  }

  const handleScroll = (pos) => {
    let state = pos.y === 0;
    setCanTouch(state);
  }

  const handleTouchStart = (e) => {
    if (!canTouch || initialed) return;
    listWrapperRef.current.style["transition"] = "";
    setDistance(0);
    setStartY(e.nativeEvent.touches[0].pageY);
    setInitialed(true);
  };

  const handleTouchMove = (e) => {
    if (!canTouch || !initialed) return;
    let distance = e.nativeEvent.touches[0].pageY - startY;
    if (distance < 0) return;
    setDistance(distance);
    listWrapperRef.current.style.transform = `translate3d(0, ${distance}px, 0)`;
  };

  const handleTouchEnd = (e) => {
    setInitialed(false);
    if (distance >= 150) {
      togglePlayListDispatch(false);
    } else {
      listWrapperRef.current.style["transition"] = "all 0.3s";
      listWrapperRef.current.style[transform] = `translate3d(0px, 0px, 0px)`;
    }
  };


  const handleShowClear = () => {
    confirmRef.current.show();
  }

  const handleConfirmClear = () => {
    clearDispatch();
    // 修复清空播放列表后点击同样的歌曲，播放器不出现的bug
    clearPreSong();
  }

  const getFavoriteIcon = (item) => {
    return (
      <i className="iconfont">&#xe601;</i>
    )
  }

  const getCurrentIcon = (item) => {
    const current = currentSong.id === item.id;
    const className = current ? 'icon-play' : '';
    const content = current ? '&#xe6e3;' : '';
    return (
      <i className={`current iconfont ${className}`} dangerouslySetInnerHTML={{ __html: content }}></i>
    )
  }

  const getPlayMode = () => {
    let content, text;
    if (mode === playMode.sequence) {
      content = "&#xe625;";
      text = "顺序播放";
    } else if (mode === playMode.loop) {
      content = "&#xe653;";
      text = "单曲循环";
    } else {
      content = "&#xe61b;";
      text = "随机播放";
    }
    return (
      <div>
        <i className="iconfont" onClick={(e) => changeMode(e)} dangerouslySetInnerHTML={{ __html: content }}></i>
        <span className="text" onClick={(e) => changeMode(e)}>{text}</span>
      </div>
    )
  }

  const onEnterCB = useCallback(() => {
    setIsShow(true);
    listWrapperRef.current.style[transform] = `translate3d(0, 100%, 0)`;
  }, [transform]);

  const onEnteringCB = useCallback(() => {
    listWrapperRef.current.style["transition"] = "all 0.3s";
    listWrapperRef.current.style[transform] = `translate3d(0, 0, 0)`;
  }, [transform]);

  const onExitCB = useCallback(() => {
    listWrapperRef.current.style[transform] = `translate3d(0, ${distance}px, 0)`;
  }, [distance, transform]);

  const onExitingCB = useCallback(() => {
    listWrapperRef.current.style["transition"] = "all 0.3s";
    listWrapperRef.current.style[transform] = `translate3d(0px, 100%, 0px)`;
  }, [transform]);

  const onExitedCB = useCallback(() => {
    setIsShow(false);
    listWrapperRef.current.style[transform] = `translate3d(0px, 100%, 0px)`;
  }, [transform]);
  const handleOpenCollectList = () => setShowColloctList(!isShowColloct)
  const handleInsetColloctList = (e, item) => {
    e.stopPropagation();
    insetColloctSong(item)
  };
  const handleDeleteSong = (e, song) => {
    e.stopPropagation();
    isShowColloct ? deleteColloctSong(song) : deleteSongDispatch(song);
  };

  return (
    <CSSTransition
      in={showPlayList}
      timeout={300}
      classNames="list-fade"
      onEnter={onEnterCB}
      onEntering={onEnteringCB}
      onExit={onExitCB}
      onExiting={onExitingCB}
      onExited={onExitedCB}
    >
      <PlayListWrapper
        ref={playListRef}
        style={isShow === true ? { display: "block" } : { display: "none" }}
        onClick={() => togglePlayListDispatch(false)}
      >
        <div
          className="list_wrapper"
          ref={listWrapperRef}
          onClick={e => e.stopPropagation()}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <ListHeader>
            <h1 className="title">
              {getPlayMode()}
              <i className="iconfont" onClick={handleOpenCollectList}>&#xe640;</i>
              <span className="iconfont clear" onClick={handleShowClear}>&#xe63d;</span>
            </h1>
          </ListHeader>
          <ScrollWrapper>
            <Scroll
              ref={listContentRef}
              onScroll={pos => handleScroll(pos)}
              bounceTop={false}
            >
              <ListContent>
                {
                  playList.map((item, index) => {
                    return (
                      <li className="item" key={item.id} onClick={() => handleChangeCurrentIndex(index)}>
                        {getCurrentIcon(item)}
                        <span className="text">{item.name} - {getName(item.ar)}</span>
                        {findIndex(item, immutableColloctList.toJS()) > -1 ? "" : <span className="like" onClick={(e) => handleInsetColloctList(e, item)} >
                          {getFavoriteIcon(item)}
                        </span>}
                        <span className="delete" onClick={(e) => handleDeleteSong(e, item)}>
                          <i className="iconfont">&#xe63d;</i>
                        </span>
                      </li>
                    )
                  })
                }
              </ListContent>
            </Scroll>
          </ScrollWrapper>
        </div>
        <Confirm ref={confirmRef} text={"是否删除全部?"} cancelBtnText={"取消"} confirmBtnText={"确定"} handleConfirm={handleConfirmClear}></Confirm>
      </PlayListWrapper>
    </CSSTransition>
  )
}

// 映射Redux全局的state到组件的props上
const mapStateToProps = (state) => ({
  currentIndex: state.getIn(['player', 'currentIndex']),
  currentSong: state.getIn(['player', 'currentSong']),
  playList: state.getIn(['player', 'playList']),
  sequencePlayList: state.getIn(['player', 'sequencePlayList']),
  showPlayList: state.getIn(['player', 'showPlayList']),
  mode: state.getIn(['player', 'mode']),
  colloctSong: state.getIn(['player', 'colloctSong']),
  colloctCurrentIndex: state.getIn(['player', 'colloctCurrentIndex']),
  colloctList: state.getIn(['player', 'colloctList']),
  colloctSequencePlayList: state.getIn(['player', 'colloctSequencePlayList']),
});
// 映射dispatch到props上
const mapDispatchToProps = (dispatch) => {
  return {
    togglePlayListDispatch(data) {
      dispatch(changeShowPlayList(data));
    },
    changeCurrentIndexDispatch(data) {
      dispatch(changeCurrentIndex(data));
    },
    changeModeDispatch(data) {
      dispatch(changePlayMode(data));
    },
    changePlayListDispatch(data) {
      dispatch(changePlayList(data));
    },
    deleteSongDispatch(data) {
      dispatch(deleteSong(data));
    },
    insetColloctSong(data) {
      dispatch(colloctInsertSong(data))
    },
    deleteColloctSong(data) {
      dispatch(colloctDeleteSong(data))
    },
    clearDispatch() {
      dispatch(changePlayList([]));
      dispatch(changeSequecePlayList([]));
      dispatch(changeCurrentIndex(-1));
      dispatch(changeShowPlayList(false));
      dispatch(changeCurrentSong({}));
      dispatch(changePlayingState(false));
    }
  }
};

// 将ui组件包装成容器组件
export default connect(mapStateToProps, mapDispatchToProps)(React.memo(PlayList));