package com.finman.dto.request;

import java.util.List;

public class RecycleBinActionRequest {

    public static class TargetItem {
        private Long id;
        private String type; // TRANSACTION, CATEGORY, BUDGET, ACCOUNT

        public TargetItem() {
        }

        public TargetItem(Long id, String type) {
            this.id = id;
            this.type = type;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getType() {
            return type;
        }

        public void setType(String type) {
            this.type = type;
        }
    }

    private List<TargetItem> items;
    private Boolean emptyAll;

    public RecycleBinActionRequest() {
    }

    public RecycleBinActionRequest(List<TargetItem> items, Boolean emptyAll) {
        this.items = items;
        this.emptyAll = emptyAll;
    }

    public List<TargetItem> getItems() {
        return items;
    }

    public void setItems(List<TargetItem> items) {
        this.items = items;
    }

    public Boolean getEmptyAll() {
        return emptyAll;
    }

    public void setEmptyAll(Boolean emptyAll) {
        this.emptyAll = emptyAll;
    }
}
