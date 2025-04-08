
import "./SearchControl.scss";

import React from "react";
import { useState, useEffect } from "react";
import { useSelector, useDispatch } from 'react-redux';
import { AudioOutlined, SearchOutlined } from "@ant-design/icons";
import { Input, Space, Card } from "antd";

import {
    setBookmarkFilterText
  } from "../../../../redux/widgets/bookMark/bookMarkAction";
const { Search } = Input;

const SearchControlBookmarkWidget = () => {

    const { t } = useLocalization({
        enStrings,
        arStrings,
        frStrings,
    });

    //hooks
    const dispatch = useDispatch();

    //function to reset the search
    const resetToDefault = () => {
    };

    const onChange = (e) => {
console.log(e.target.value,"taaaaaaaaaaaaarget");
setTimeout(()=>{
    dispatch(setBookmarkFilterText(e.target.value))
},500)
    }

    const onPress = (e) => {
    }

    return (
        <>
            <Search
                placeholder={t("search")}
                onChange={onChange}
                style={{
                    width: "100%",
                }}
                allowClear={true}
                className={"ant-input-search_custom with_white_bg"}
                onPressEnter={onPress}
                addonBefore={<SearchOutlined />}
            />

        </>
    );
};
export default SearchControlBookmarkWidget;
